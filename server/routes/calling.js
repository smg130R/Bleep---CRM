const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Auto-detect and fix swapped fields in calling sheet rows
function smartCleanRow(row) {
  const r = { ...row };

  // Heuristic: if customerName looks like an email, find the real name in another field
  if (r.customerName && r.customerName.includes('@')) {
    // Try college -> it often has the actual name
    if (r.college && !r.college.includes('@') && !/^\d+$/.test(r.college.replace(/\s/g, ''))) {
      [r.customerName, r.college] = [r.college, r.customerName];
    }
    // Try branch if college didn't work
    else if (r.branch && !r.branch.includes('@') && !/^\d+$/.test(r.branch.replace(/\s/g, ''))) {
      [r.customerName, r.branch] = [r.branch, r.customerName];
    }
  }

  // Heuristic: if contact looks like a name/email (not 10+ digits), find the real number
  const contactDigits = (r.contact || '').replace(/[\s\-\+\(\)]/g, '');
  if (r.contact && (r.contact.includes('@') || contactDigits.length < 10 || isNaN(Number(contactDigits)))) {
    for (const field of ['college', 'branch', 'year']) {
      const val = (r[field] || '').replace(/[\s\-\+\(\)]/g, '');
      if (val.length >= 10 && !isNaN(Number(val))) {
        [r.contact, r[field]] = [r[field], r.contact];
        break;
      }
    }
  }

  // Heuristic: if college has an email and branch has a college name, swap them
  if (r.college && r.college.includes('@') && r.branch && !r.branch.includes('@')) {
    const branchDigits = (r.branch || '').replace(/[\s\-\+\(\)]/g, '');
    // Only swap if branch doesn't look like a phone number
    if (branchDigits.length < 10 || isNaN(Number(branchDigits))) {
      [r.college, r.branch] = [r.branch, r.college];
    }
  }

  // Heuristic: if branch looks like a college name (not a dept/stream), swap with college
  const branchLower = (r.branch || '').toLowerCase();
  const collegeLower = (r.college || '').toLowerCase();
  const streamKeywords = ['engineering', 'science', 'technology', 'computer', 'bca', 'bsc', 'bba', 'bcom', 'ba', 'management', 'mechanical', 'civil', 'electrical', 'electronics', 'information', 'cse', 'it', 'aiml', 'ece', 'eee', 'ai'];
  const collegeKeywords = ['university', 'college', 'institute', 'school', 'academy', 'campus'];

  if (collegeLower && branchLower) {
    const branchLooksLikeCollege = collegeKeywords.some(k => branchLower.includes(k));
    const collegeLooksLikeDept = streamKeywords.some(k => collegeLower.includes(k));
    if (branchLooksLikeCollege && collegeLooksLikeDept) {
      [r.college, r.branch] = [r.branch, r.college];
    }
  }

  return r;
}

// GET /api/calling - Get BDA's own calling sheet (with smart field cleanup)
router.get('/', authenticateToken, requireRoles(['bda']), async (req, res) => {
  try {
    const { data: list, error } = await supabase
      .from('calling_sheet')
      .select('*')
      .eq('assignedUserId', req.user.id)
      .order('id', { ascending: true });

    if (error) throw error;
    const cleaned = (list || []).map(smartCleanRow);
    return res.json({ callingSheet: cleaned });
  } catch (error) {
    console.error('Get calling sheet error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/calling/:id - Update status and remarks + Recalculate KPIs
router.patch('/:id', authenticateToken, requireRoles(['bda']), async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Get existing customer record
    const { data: customer, error: fetchErr } = await supabase
      .from('calling_sheet')
      .select('*')
      .eq('id', id)
      .eq('assignedUserId', req.user.id)
      .single();
    
    if (fetchErr || !customer) {
      return res.status(404).json({ message: 'Customer record not found or unauthorized.' });
    }

    // Apply smart cleanup so lead matching uses corrected fields
    const cleanCustomer = smartCleanRow(customer);

    // Update calling sheet
    await supabase
      .from('calling_sheet')
      .update({ status, remarks: remarks || '', lastUpdated: todayStr })
      .eq('id', id);

    // Sync status back to team lead data if this lead came from master sheet
    if (req.user.teamId) {
      try {
        const teamLeadData = require('../services/teamLeadData');
        const leads = await teamLeadData.getLeads(req.user.teamId);
        const match = leads.find(l =>
          l.customerName === cleanCustomer.customerName && l.contact === cleanCustomer.contact
        );
        if (match) {
          const newStatus = status.toLowerCase().replace(/\s+/g, '_');
          const isValidStatus = ['na', 'ni', 'form_shared', 'screenshot_shared', 'busy', 'switch_off', 'out_of_service', 'pending'];
          if (newStatus === 'na') {
            await teamLeadData.updateLead(req.user.teamId, match.id, { status: 'na' });
            await teamLeadData.addAssignment(req.user.teamId, {
              leadId: match.id, assignedTo: req.user.id, assignedBy: req.user.id,
              status: 'na', remarks: remarks || ''
            });
          } else if (isValidStatus.includes(newStatus)) {
            await teamLeadData.updateLead(req.user.teamId, match.id, { status: newStatus });
            if (['form_shared', 'screenshot_shared'].includes(newStatus)) {
              await teamLeadData.updateLead(req.user.teamId, match.id, { assignedInMaster: true });
            }
            await teamLeadData.addAssignment(req.user.teamId, {
              leadId: match.id, assignedTo: req.user.id, assignedBy: req.user.id,
              status: newStatus, remarks: remarks || ''
            });
          }
        }
      } catch (syncErr) {
        console.error('Team lead data sync error (non-fatal):', syncErr.message);
      }
    }

    // Recalculate KPIs for this BDA for today
    const { data: allRecords, error: recordsErr } = await supabase
      .from('calling_sheet')
      .select('status')
      .eq('assignedUserId', req.user.id);

    if (recordsErr) throw recordsErr;
    
    let callsCount = 0;
    let connectsCount = 0;
    let prospectsCount = 0;
    let dealsCount = 0;
    let followupsCount = 0;

    const connectStatuses = ['Connected', 'Interested', 'NI', 'FORM SHARED', 'SCREENSHOT SHARED', 'Deal Closed'];
    (allRecords || []).forEach(rec => {
      const s = rec.status;
      if (s !== 'Pending' && s !== 'unassigned') {
        callsCount++;
      }
      if (connectStatuses.includes(s)) {
        connectsCount++;
      }
      if (s === 'Interested') prospectsCount++;
      if (s === 'Deal Closed') dealsCount++;
      if (s === 'Follow-up') followupsCount++;
    });

    // Determine morning/evening slot
    const currentHour = new Date().getHours();
    const isMorning = currentHour < 14;

    // Get today's KPI record
    const { data: kpi, error: kpiErr } = await supabase
      .from('kpi_records')
      .select('*')
      .eq('userId', req.user.id)
      .eq('date', todayStr)
      .single();

    if (kpiErr && kpiErr.code !== 'PGRST116') throw kpiErr;

    let mCalls = kpi ? kpi.mCalls : 0;
    let mConn = kpi ? kpi.mConn : 0;
    let mSS = kpi ? kpi.mSS : 0;
    let mPros = kpi ? kpi.mPros : 0;
    let eCalls = kpi ? kpi.eCalls : 0;
    let eConn = kpi ? kpi.eConn : 0;
    let eSS = kpi ? kpi.eSS : 0;
    let ePros = kpi ? kpi.ePros : 0;

    if (!kpi) {
      if (isMorning) {
        mCalls = callsCount;
        mConn = connectsCount;
        mPros = prospectsCount;
      } else {
        eCalls = callsCount;
        eConn = connectsCount;
        ePros = prospectsCount;
      }
    } else {
      if (isMorning) {
        mCalls = Math.max(callsCount - eCalls, 0);
        mConn = Math.max(connectsCount - eConn, 0);
        mPros = prospectsCount;
      } else {
        eCalls = Math.max(callsCount - mCalls, 0);
        eConn = Math.max(connectsCount - mConn, 0);
        ePros = prospectsCount;
      }
    }

    const totalCalls = mCalls + eCalls;
    const totalConn = mConn + eConn;
    let perfScore = totalCalls > 0 ? parseFloat(((totalConn / totalCalls) * 60 + (dealsCount * 20)).toFixed(2)) : 0;
    if (perfScore > 100) perfScore = 100;

    if (!kpi) {
      const { error: insertErr } = await supabase
        .from('kpi_records')
        .insert({
          userId: req.user.id,
          date: todayStr,
          mCalls, mConn, mSS, mPros,
          eCalls, eConn, eSS, ePros,
          deals: dealsCount,
          followups: followupsCount,
          perfScore
        });

      if (insertErr) throw insertErr;
    } else {
      const { error: updateKpiErr } = await supabase
        .from('kpi_records')
        .update({
          mCalls, mConn, mPros,
          eCalls, eConn, ePros,
          deals: dealsCount,
          followups: followupsCount,
          perfScore
        })
        .eq('userId', req.user.id)
        .eq('date', todayStr);

      if (updateKpiErr) throw updateKpiErr;
    }

    return res.json({ 
      message: 'Calling sheet and KPI updated successfully', 
      customer: { ...customer, status, remarks, lastUpdated: todayStr } 
    });
  } catch (error) {
    console.error('Update calling sheet row error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/calling/fetch-leads - BDA fetches 50 unassigned leads from the team pool
router.post('/fetch-leads', authenticateToken, requireRoles(['bda']), async (req, res) => {
  try {
    const bdaId = req.user.id;
    const teamId = req.user.teamId;

    if (!teamId) {
      return res.status(400).json({ message: 'You are not assigned to a team.' });
    }

    const { data: unassigned, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('teamId', teamId)
      .eq('status', 'unassigned')
      .order('id')
      .limit(50);

    if (fetchError) throw fetchError;
    if (!unassigned || unassigned.length === 0) {
      return res.json({ message: 'No new leads available right now.', count: 0 });
    }

    const today = new Date().toISOString().split('T')[0];
    const leadIds = unassigned.map(l => l.id);

    const { error: updateError } = await supabase
      .from('leads')
      .update({ status: 'assigned', currentAssigneeId: bdaId, updatedAt: today })
      .in('id', leadIds);

    if (updateError) throw updateError;

    // Clean up swapped fields before inserting into calling_sheet
    const cleanLeads = unassigned.map(lead => smartCleanRow(lead));

    const callingEntries = cleanLeads.map(lead => ({
      assignedUserId: bdaId,
      leadId: lead.id,
      customerName: lead.customerName,
      contact: lead.contact,
      college: lead.college || '',
      branch: lead.branch || '',
      year: lead.year || '',
      status: 'Pending',
      naCount: lead.naCount || 0,
      remarks: '',
      lastUpdated: today,
    }));

    const { error: insertError } = await supabase
      .from('calling_sheet')
      .insert(callingEntries);

    if (insertError) throw insertError;

    return res.json({
      message: `Fetched ${unassigned.length} new leads.`,
      count: unassigned.length,
    });
  } catch (error) {
    console.error('Fetch leads error:', error);
    return res.status(500).json({ message: 'Error fetching leads: ' + error.message });
  }
});

// POST /api/calling/fix-data - Permanently fix swapped fields in existing calling sheet & leads
router.post('/fix-data', authenticateToken, requireRoles(['bda', 'team_lead', 'admin']), async (req, res) => {
  try {
    const targetUserId = req.user.role === 'bda' ? req.user.id : (req.body.userId || req.user.id);
    const today = new Date().toISOString().split('T')[0];
    let fixedCalling = 0;
    let fixedLeads = 0;

    // Fix calling_sheet for this user
    const { data: callingRows } = await supabase
      .from('calling_sheet')
      .select('*')
      .eq('assignedUserId', targetUserId);

    if (callingRows) {
      for (const row of callingRows) {
        const cleaned = smartCleanRow({ ...row });
        const changed = cleaned.customerName !== row.customerName
          || cleaned.contact !== row.contact
          || cleaned.college !== (row.college || '')
          || cleaned.branch !== (row.branch || '')
          || cleaned.year !== (row.year || '');
        if (changed) {
          await supabase.from('calling_sheet').update({
            customerName: cleaned.customerName,
            contact: cleaned.contact,
            college: cleaned.college || '',
            branch: cleaned.branch || '',
            year: cleaned.year || '',
            lastUpdated: today,
          }).eq('id', row.id);
          fixedCalling++;
        }
      }
    }

    // Fix leads table (same user's assigned leads or team-wide for team_lead/admin)
    let leadQuery = supabase.from('leads').select('*');
    if (req.user.role === 'bda') {
      leadQuery = leadQuery.eq('currentAssigneeId', targetUserId);
    } else if (req.user.teamId) {
      leadQuery = leadQuery.eq('teamId', req.user.teamId);
    }
    const { data: leadRows } = await leadQuery;

    if (leadRows) {
      for (const row of leadRows) {
        const cleaned = smartCleanRow({ ...row });
        const changed = cleaned.customerName !== row.customerName
          || cleaned.contact !== row.contact
          || cleaned.college !== (row.college || '')
          || cleaned.branch !== (row.branch || '')
          || cleaned.year !== (row.year || '');
        if (changed) {
          await supabase.from('leads').update({
            customerName: cleaned.customerName,
            contact: cleaned.contact,
            college: cleaned.college || '',
            branch: cleaned.branch || '',
            year: cleaned.year || '',
            updatedAt: today,
          }).eq('id', row.id);
          fixedLeads++;
        }
      }
    }

    return res.json({
      message: `Fixed ${fixedCalling} calling sheet records and ${fixedLeads} leads.`,
      fixedCalling,
      fixedLeads,
    });
  } catch (error) {
    console.error('Fix data error:', error);
    return res.status(500).json({ message: 'Error fixing data: ' + error.message });
  }
});

module.exports = router;
