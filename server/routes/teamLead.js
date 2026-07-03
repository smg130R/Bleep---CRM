const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const teamLeadData = require('../services/teamLeadData');

// GET /api/team-lead/config - Get team's master sheet URL
router.get('/config', authenticateToken, requireRoles(['team_lead', 'admin']), async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ message: 'You are not assigned to a team.' });
    const url = await teamLeadData.getMasterSheetUrl(teamId);
    return res.json({ masterSheetUrl: url });
  } catch (error) {
    console.error('Get team config error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/team-lead/config - Set master sheet URL
router.put('/config', authenticateToken, requireRoles(['team_lead', 'admin']), async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ message: 'You are not assigned to a team.' });
    const { masterSheetUrl } = req.body;
    if (!masterSheetUrl) return res.status(400).json({ message: 'Master sheet URL is required.' });
    await teamLeadData.setMasterSheetUrl(teamId, masterSheetUrl);
    return res.json({ message: 'Master sheet URL saved.' });
  } catch (error) {
    console.error('Set team config error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/team-lead/import - Import leads from master Google Sheet
router.post('/import', authenticateToken, requireRoles(['team_lead', 'admin']), async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ message: 'You are not assigned to a team.' });

    const masterSheetUrl = await teamLeadData.getMasterSheetUrl(teamId);
    if (!masterSheetUrl) {
      return res.status(400).json({ message: 'No master sheet URL configured. Save your sheet URL first.' });
    }

    const { extractSheetId, importLeadsFromMasterSheet } = require('../services/sheetsSync');
    const sheetId = extractSheetId(masterSheetUrl);
    const leads = await importLeadsFromMasterSheet(sheetId);

    if (leads.length === 0) {
      return res.status(400).json({ message: 'No leads found in the master sheet. Check the sheet has data starting from row 2 (Name, Contact, College, Branch, Year).' });
    }

    const added = await teamLeadData.addLeads(teamId, leads);
    return res.json({ message: `Imported ${added.length} new leads from master sheet.`, added: added.length });
  } catch (error) {
    console.error('Import leads error:', error);
    return res.status(500).json({ message: 'Error reading master sheet: ' + error.message });
  }
});

// GET /api/team-lead/leads - Get all leads for the team
router.get('/leads', authenticateToken, requireRoles(['team_lead', 'admin']), async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ message: 'You are not assigned to a team.' });
    const leads = await teamLeadData.getLeads(teamId);

    // Enrich with BDA names
    const assigneeIds = [...new Set(leads.filter(l => l.currentAssigneeId).map(l => l.currentAssigneeId))];
    let bdaMap = {};
    if (assigneeIds.length > 0) {
      const { data: bdas } = await supabase.from('users').select('id, name').in('id', assigneeIds);
      bdaMap = Object.fromEntries((bdas || []).map(b => [b.id, b.name]));
    }

    const enriched = leads.map(l => ({
      ...l,
      assigneeName: bdaMap[l.currentAssigneeId] || null,
    }));

    return res.json({ leads: enriched, total: enriched.length });
  } catch (error) {
    console.error('Get leads error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/team-lead/distribute - Distribute leads to present BDAs
router.post('/distribute', authenticateToken, requireRoles(['team_lead', 'admin']), async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ message: 'You are not assigned to a team.' });

    const result = await teamLeadData.distributeLeads(teamId, req.user.id);
    return res.json(result);
  } catch (error) {
    console.error('Distribute leads error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/team-lead/reassign-na - Reassign NA leads to other BDAs
router.post('/reassign-na', authenticateToken, requireRoles(['team_lead', 'admin']), async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ message: 'You are not assigned to a team.' });

    const result = await teamLeadData.reassignNaLeads(teamId, req.user.id);
    return res.json(result);
  } catch (error) {
    console.error('Reassign NA leads error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/team-lead/assignments - Get assignment history
router.get('/assignments', authenticateToken, requireRoles(['team_lead', 'admin']), async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ message: 'You are not assigned to a team.' });

    const assignments = await teamLeadData.getAssignments(teamId);

    // Enrich with names
    const userIds = [...new Set(assignments.flatMap(a => [a.assignedTo, a.assignedBy].filter(Boolean)))];
    let userMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, name').in('id', userIds);
      userMap = Object.fromEntries((users || []).map(u => [u.id, u.name]));
    }

    const enriched = assignments.map(a => ({
      ...a,
      assigneeName: userMap[a.assignedTo] || null,
      assignerName: userMap[a.assignedBy] || null,
    }));

    return res.json({ assignments: enriched });
  } catch (error) {
    console.error('Get assignments error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/team-lead/bdas - Get active BDAs in team
router.get('/bdas', authenticateToken, requireRoles(['team_lead', 'admin']), async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ message: 'You are not assigned to a team.' });

    const bdas = await teamLeadData.getPresentBdas(teamId);
    return res.json({ bdas, presentCount: bdas.length });
  } catch (error) {
    console.error('Get BDAs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/team-lead/bdas-with-sheets - Get BDAs with their sheet URLs
router.get('/bdas-with-sheets', authenticateToken, requireRoles(['team_lead', 'admin']), async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ message: 'You are not assigned to a team.' });

    const { data: bdas } = await supabase
      .from('users')
      .select('id, name, email, "assignedSheetUrl", "prospectSheetUrl", "assignedSheetTab", "prospectSheetTab"')
      .eq('role', 'bda')
      .eq('teamId', teamId)
      .eq('status', 'active')
      .order('name');

    return res.json({ bdas: bdas || [] });
  } catch (error) {
    console.error('Get BDAs with sheets error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/team-lead/bda-sheets/:bdaId - Team lead sets BDA sheet URLs
router.patch('/bda-sheets/:bdaId', authenticateToken, requireRoles(['team_lead', 'admin']), async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ message: 'You are not assigned to a team.' });

    const { bdaId } = req.params;
    const { assignedSheetUrl, prospectSheetUrl, assignedSheetTab, prospectSheetTab } = req.body;

    // Verify BDA is in TL's team
    const { data: bda } = await supabase.from('users').select('id, teamId').eq('id', bdaId).eq('role', 'bda').single();
    if (!bda || bda.teamId !== teamId) {
      return res.status(403).json({ message: 'BDA not found in your team.' });
    }

    const updates = {};
    if (assignedSheetUrl !== undefined) updates.assignedSheetUrl = assignedSheetUrl;
    if (prospectSheetUrl !== undefined) updates.prospectSheetUrl = prospectSheetUrl;
    if (assignedSheetTab !== undefined) updates.assignedSheetTab = assignedSheetTab;
    if (prospectSheetTab !== undefined) updates.prospectSheetTab = prospectSheetTab;

    await supabase.from('users').update(updates).eq('id', bdaId);
    return res.json({ message: 'BDA sheet config updated.' });
  } catch (error) {
    console.error('Set BDA sheets error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
