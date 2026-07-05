const supabase = require('../db/supabase');

// ── Team Config (masterSheetUrl on teams table) ──

async function getMasterSheetUrl(teamId) {
  const { data } = await supabase.from('teams').select('"masterSheetUrl"').eq('id', teamId).limit(1).maybeSingle();
  return data?.masterSheetUrl || '';
}

async function setMasterSheetUrl(teamId, url) {
  await supabase.from('teams').update({ masterSheetUrl: url }).eq('id', teamId);
}

// ── Leads ──

async function getLeads(teamId) {
  const { data } = await supabase.from('leads').select('*').eq('teamId', teamId).order('id');
  return data || [];
}

async function getLeadById(teamId, leadId) {
  const { data } = await supabase.from('leads').select('*').eq('id', leadId).eq('teamId', teamId).limit(1).maybeSingle();
  return data || null;
}

async function addLeads(teamId, newLeads) {
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase.from('leads').select('"customerName", contact').eq('teamId', teamId);
  const existingSet = new Set((existing || []).map(l => `${l.customerName}|${l.contact}`));

  const toInsert = [];
  for (const lead of newLeads) {
    const key = `${lead.customerName}|${lead.contact}`;
    if (!existingSet.has(key)) {
      toInsert.push({
        teamId,
        customerName: lead.customerName,
        contact: lead.contact,
        college: lead.college || '',
        branch: lead.branch || '',
        year: lead.year || '',
        status: 'unassigned',
        naCount: 0,
        assignedInMaster: false,
        currentAssigneeId: null,
        batchDate: today,
        createdAt: today,
        updatedAt: today,
      });
      existingSet.add(key);
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('leads').insert(toInsert);
    if (error) throw error;
  }
  return toInsert;
}

async function updateLead(teamId, leadId, updates) {
  updates.updatedAt = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('leads').update(updates).eq('id', leadId).eq('teamId', teamId).select().limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

// ── Lead Assignments ──

async function getAssignments(teamId) {
  const { data } = await supabase.from('lead_assignments').select('*').in('leadId',
    supabase.from('leads').select('id').eq('teamId', teamId)
  ).order('id', { ascending: false });
  return data || [];
}

async function addAssignment(teamId, entry) {
  const { error } = await supabase.from('lead_assignments').insert({
    leadId: entry.leadId,
    assignedTo: entry.assignedTo,
    assignedBy: entry.assignedBy || null,
    assignedDate: new Date().toISOString().split('T')[0],
    status: entry.status || null,
    remarks: entry.remarks || '',
  });
  if (error) throw error;
}

// ── BDA helpers ──

async function getActiveBdasForTeam(teamId) {
  return supabase
    .from('users')
    .select('id, name, email, phone')
    .eq('role', 'bda')
    .eq('teamId', teamId)
    .eq('status', 'active');
}

async function getPresentBdas(teamId) {
  const { data: bdas, error } = await getActiveBdasForTeam(teamId);
  if (error) throw error;
  if (!bdas || bdas.length === 0) return [];

  const today = new Date().toISOString().split('T')[0];
  const { data: absentBdas } = await supabase
    .from('leaves')
    .select('"employeeId"')
    .eq('status', 'Approved')
    .lte('fromDate', today)
    .gte('toDate', today);

  const absentIds = new Set((absentBdas || []).map(l => l.employeeId));
  return bdas.filter(b => !absentIds.has(b.id));
}

// ── Distribution ──

async function distributeLeads(teamId, assignedBy) {
  const { data: unassigned, error } = await supabase
    .from('leads')
    .select('*')
    .eq('teamId', teamId)
    .eq('status', 'unassigned')
    .order('id');

  if (error) throw error;
  if (!unassigned || unassigned.length === 0) return { distributed: 0, message: 'No unassigned leads' };

  const bdas = await getPresentBdas(teamId);
  if (bdas.length === 0) return { distributed: 0, message: 'No active BDAs present today' };

  const today = new Date().toISOString().split('T')[0];
  const perBda = Math.floor(unassigned.length / bdas.length);
  let remainder = unassigned.length % bdas.length;
  let leadIdx = 0;

  for (const bda of bdas) {
    const count = perBda + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    const batch = unassigned.slice(leadIdx, leadIdx + count);
    leadIdx += count;

    const ids = batch.map(l => l.id);
    if (ids.length === 0) continue;

    // Update leads status + assignee
    await supabase.from('leads').update({ status: 'assigned', currentAssigneeId: bda.id, updatedAt: today }).in('id', ids);

    // Create calling_sheet rows
    const sheetRows = batch.map(l => ({
      assignedUserId: bda.id,
      leadId: l.id,
      customerName: l.customerName,
      contact: l.contact,
      college: l.college,
      branch: l.branch,
      year: l.year,
      status: 'Pending',
      naCount: 0,
      remarks: '',
      lastUpdated: today,
    }));
    await supabase.from('calling_sheet').insert(sheetRows);

    // Assignment records
    const assignRows = batch.map(l => ({
      leadId: l.id,
      assignedTo: bda.id,
      assignedBy,
      assignedDate: today,
      status: null,
      remarks: '',
    }));
    await supabase.from('lead_assignments').insert(assignRows);
  }

  // Push to each BDA's Google Sheet
  try {
    const { pushBdaLeadsToSheet, extractSheetId } = require('./sheetsSync');
    for (const bda of bdas) {
      const { data: user } = await supabase.from('users').select('"assignedSheetUrl", "assignedSheetTab"').eq('id', bda.id).single();
      if (user?.assignedSheetUrl) {
        const sid = extractSheetId(user.assignedSheetUrl);
        await pushBdaLeadsToSheet(bda.id, sid, user.assignedSheetTab || 'Sheet1');
      }
    }
  } catch (pushErr) {
    console.error('Push to sheets error (non-fatal):', pushErr.message);
  }

  return { distributed: leadIdx, message: `Distributed ${leadIdx} leads to ${bdas.length} BDAs` };
}

// ── NA Reassignment ──

async function reassignNaLeads(teamId, assignedBy) {
  const { data: naLeads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('teamId', teamId)
    .eq('status', 'na')
    .order('id');

  if (error) throw error;
  if (!naLeads || naLeads.length === 0) return { reassigned: 0, message: 'No NA leads to reassign' };

  const bdas = await getPresentBdas(teamId);
  if (bdas.length === 0) return { reassigned: 0, message: 'No active BDAs present today' };

  const today = new Date().toISOString().split('T')[0];
  let reassigned = 0;
  let dropped = 0;

  for (let i = 0; i < naLeads.length; i++) {
    const lead = naLeads[i];
    const newNaCount = (lead.naCount || 0) + 1;

    if (newNaCount >= 5) {
      await supabase.from('leads').update({ status: 'dropped', naCount: newNaCount, updatedAt: today }).eq('id', lead.id);
      await supabase.from('calling_sheet').delete().eq('leadId', lead.id);
      dropped++;
      continue;
    }

    // Pick next BDA avoiding same one
    let bdaIdx = i % bdas.length;
    let newBda = bdas[bdaIdx];
    if (newBda.id === lead.currentAssigneeId && bdas.length > 1) {
      bdaIdx = (bdaIdx + 1) % bdas.length;
      newBda = bdas[bdaIdx];
    }

    await supabase.from('leads').update({ status: 'assigned', naCount: newNaCount, currentAssigneeId: newBda.id, updatedAt: today }).eq('id', lead.id);

    // Delete old calling_sheet row
    await supabase.from('calling_sheet').delete().eq('leadId', lead.id);

    // Create new calling_sheet row
    await supabase.from('calling_sheet').insert({
      assignedUserId: newBda.id,
      leadId: lead.id,
      customerName: lead.customerName,
      contact: lead.contact,
      college: lead.college,
      branch: lead.branch,
      year: lead.year,
      status: 'Pending',
      naCount: newNaCount,
      remarks: '',
      lastUpdated: today,
    });

    // Assignment record
    await supabase.from('lead_assignments').insert({
      leadId: lead.id,
      assignedTo: newBda.id,
      assignedBy,
      assignedDate: today,
      status: null,
      remarks: `Reassigned (NA#${newNaCount})`,
    });

    reassigned++;
  }

  // Push updated sheets for affected BDAs
  try {
    const { pushBdaLeadsToSheet, extractSheetId } = require('./sheetsSync');
    const affectedIds = [...new Set([...naLeads.map(l => l.currentAssigneeId), ...bdas.map(b => b.id)].filter(Boolean))];
    for (const bdaId of affectedIds) {
      const { data: user } = await supabase.from('users').select('"assignedSheetUrl", "assignedSheetTab"').eq('id', bdaId).single();
      if (user?.assignedSheetUrl) {
        const sid = extractSheetId(user.assignedSheetUrl);
        await pushBdaLeadsToSheet(bdaId, sid, user.assignedSheetTab || 'Sheet1');
      }
    }
  } catch (pushErr) {
    console.error('Push to sheets error (non-fatal):', pushErr.message);
  }

  return { reassigned, dropped, message: `Reassigned ${reassigned}, dropped ${dropped} leads` };
}

module.exports = {
  getMasterSheetUrl,
  setMasterSheetUrl,
  getLeads,
  getLeadById,
  addLeads,
  updateLead,
  getAssignments,
  addAssignment,
  getActiveBdasForTeam,
  getPresentBdas,
  distributeLeads,
  reassignNaLeads,
};
