const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');

async function getConfig() {
  const { data } = await supabase.from('platform_config').select('key, value');
  const config = {};
  for (const row of data || []) {
    config[row.key] = row.value;
  }
  return config;
}

async function setConfig(key, value) {
  await supabase.from('platform_config').upsert({ key, value }, { onConflict: 'key' });
}

// GET /api/settings - Get platform config
router.get('/', authenticateToken, requireRoles(['admin', 'ops_head', 'hr']), async (req, res) => {
  try {
    const config = await getConfig();
    return res.json({ config });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/settings - Save platform config
router.put('/', authenticateToken, requireRoles(['admin']), async (req, res) => {
  try {
    const { cronTimeMorning, cronTimeEvening, minCallsTarget } = req.body;
    if (cronTimeMorning !== undefined) await setConfig('cronTimeMorning', cronTimeMorning);
    if (cronTimeEvening !== undefined) await setConfig('cronTimeEvening', cronTimeEvening);
    if (minCallsTarget !== undefined) await setConfig('minCallsTarget', String(minCallsTarget));
    return res.json({ message: 'Platform settings saved.' });
  } catch (error) {
    console.error('Save settings error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/settings/bdas - Get all BDAs with targetCalls
router.get('/bdas', authenticateToken, requireRoles(['admin', 'ops_head', 'hr']), async (req, res) => {
  try {
    let query = supabase
      .from('users')
      .select('id, name, email, role, teamId, "targetCalls"')
      .eq('role', 'bda')
      .eq('status', 'active')
      .order('name');

    if (req.user.role !== 'admin') {
      query = query.eq('teamId', req.user.teamId);
    }

    const { data: bdas, error } = await query;
    if (error) throw error;

    const teamIds = [...new Set((bdas || []).map(b => b.teamId).filter(Boolean))];
    let teamMap = {};
    if (teamIds.length > 0) {
      const { data: teams } = await supabase.from('teams').select('id, name').in('id', teamIds);
      teamMap = Object.fromEntries((teams || []).map(t => [t.id, t.name]));
    }

    const enriched = (bdas || []).map(b => ({
      ...b,
      teamName: teamMap[b.teamId] || 'Unassigned',
    }));

    return res.json({ bdas: enriched });
  } catch (error) {
    console.error('Get BDAs for settings error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/settings/bdas/:id/target - Update BDA target calls
router.put('/bdas/:id/target', authenticateToken, requireRoles(['admin', 'ops_head', 'hr']), async (req, res) => {
  try {
    const { id } = req.params;
    const { targetCalls } = req.body;

    const { data: bda } = await supabase.from('users').select('id, role, teamId').eq('id', id).single();
    if (!bda || bda.role !== 'bda') {
      return res.status(404).json({ message: 'BDA not found.' });
    }

    if (req.user.role !== 'admin' && req.user.teamId !== bda.teamId) {
      return res.status(403).json({ message: 'You can only set targets for BDAs in your team.' });
    }

    const { error } = await supabase.from('users').update({ targetCalls: Number(targetCalls) || 0 }).eq('id', id);
    if (error) throw error;

    return res.json({ message: 'Target calls updated.' });
  } catch (error) {
    console.error('Update BDA target error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/settings/clear-master-sheet/:teamId - Clear master sheet URL for a team
router.post('/clear-master-sheet/:teamId', authenticateToken, requireRoles(['admin']), async (req, res) => {
  try {
    const { teamId } = req.params;

    const { data: team } = await supabase.from('teams').select('id').eq('id', teamId).single();
    if (!team) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    await supabase.from('teams').update({ masterSheetUrl: null }).eq('id', teamId);
    return res.json({ message: 'Master sheet URL cleared for team.' });
  } catch (error) {
    console.error('Clear master sheet error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
