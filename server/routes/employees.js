const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/employees - All employees (Admin, HR, Ops Head)
router.get('/', authenticateToken, requireRoles(['admin', 'hr', 'ops_head']), async (req, res) => {
  try {
    const { data: employees, error } = await supabase
      .from('users')
      .select('id, name, email, role, phone, teamId, joinedDate, status')
      .order('role')
      .order('name');

    if (error) throw error;
    return res.json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/employees/teams - List all teams and their leads
router.get('/teams', authenticateToken, requireRoles(['admin', 'ops_head', 'hr', 'team_lead']), async (req, res) => {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name, leadId, users(name, email)')
      .order('id');

    if (error) throw error;

    // Reshape to match old API: leadName, leadEmail at top level
    const shaped = (teams || []).map(t => ({
      id: t.id,
      name: t.name,
      leadId: t.leadId,
      leadName: t.users?.name || null,
      leadEmail: t.users?.email || null
    }));

    return res.json({ teams: shaped });
  } catch (error) {
    console.error('Get teams error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/employees/teams/:teamId/bda-performance
router.get('/teams/:teamId/bda-performance', authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  const dateFilter = req.query.date || new Date().toISOString().split('T')[0];

  if (req.user.role === 'team_lead' && req.user.teamId !== teamId) {
    return res.status(403).json({ message: 'Access denied. You can only view your own team.' });
  }
  if (!['admin', 'ops_head', 'team_lead'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Unauthorized role.' });
  }

  try {
    // Get BDAs in team
    const { data: bdas, error: bdaErr } = await supabase
      .from('users')
      .select('id, name, email, phone, status')
      .eq('role', 'bda')
      .eq('teamId', teamId);

    if (bdaErr) throw bdaErr;

    // Get KPI records for those BDAs on the date
    const bdaIds = (bdas || []).map(b => b.id);
    const { data: kpis, error: kpiErr } = await supabase
      .from('kpi_records')
      .select('*')
      .in('userId', bdaIds.length ? bdaIds : [0])
      .eq('date', dateFilter);

    if (kpiErr) throw kpiErr;

    const kpiMap = {};
    (kpis || []).forEach(k => { kpiMap[k.userId] = k; });

    const performance = (bdas || []).map(u => {
      const k = kpiMap[u.id] || {};
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        userStatus: u.status,
        date: k.date || null,
        mCalls: k.mCalls || 0,
        mConn: k.mConn || 0,
        mSS: k.mSS || 0,
        mPros: k.mPros || 0,
        eCalls: k.eCalls || 0,
        eConn: k.eConn || 0,
        eSS: k.eSS || 0,
        ePros: k.ePros || 0,
        deals: k.deals || 0,
        followups: k.followups || 0,
        perfScore: k.perfScore || 0
      };
    }).sort((a, b) => b.perfScore - a.perfScore || a.name.localeCompare(b.name));

    // Get team lead
    const { data: leads } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .eq('role', 'team_lead')
      .eq('teamId', teamId);

    return res.json({ teamId, teamLead: leads?.[0] || null, date: dateFilter, performance });
  } catch (error) {
    console.error('Get team performance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/employees - Add new employee
router.post('/', authenticateToken, requireRoles(['admin', 'hr', 'ops_head', 'team_lead']), async (req, res) => {
  const { name, email, role, phone, teamId, teamName, password } = req.body;
  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: 'Name, email, role, and password are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const validRoles = ['admin', 'ops_head', 'hr', 'team_lead', 'bda'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  // Role-based permission: who can create whom
  const createPermissions = {
    admin: ['admin', 'ops_head', 'hr', 'team_lead', 'bda'],
    hr: ['team_lead', 'bda'],
    ops_head: ['team_lead', 'bda'],
    team_lead: ['bda']
  };
  const allowedTargets = createPermissions[req.user.role] || [];
  if (!allowedTargets.includes(role)) {
    return res.status(403).json({ message: `You do not have permission to create ${role} accounts.` });
  }

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, phone, teamId }
    });

    if (authError) {
      if (authError.message?.includes('already exists') || authError.status === 409) {
        return res.status(400).json({ message: 'Email address already exists.' });
      }
      throw authError;
    }

    // Create public.users row directly (the Supabase trigger may not exist)
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        name,
        email,
        role,
        phone: phone || null,
        teamId: teamId || null,
        status: 'active',
        authId: authData.user.id
      })
      .select('id')
      .limit(1);

    if (insertErr) {
      console.error('Insert user row error:', insertErr.message);
      return res.status(500).json({ message: 'Failed to create user record.' });
    }

    // If creating a team lead with a team name, create the team record
    if (role === 'team_lead' && req.body.teamName && newUser?.[0]) {
      const teamId = req.body.teamName.replace(/\s+/g, '');
      const { error: teamErr } = await supabase.from('teams').insert({
        id: teamId,
        name: req.body.teamName,
        leadId: newUser[0].id
      });

      if (teamErr) {
        console.error('Create team error:', teamErr.message);
      } else {
        await supabase.from('users').update({ teamId }).eq('id', newUser[0].id);
      }
    }

    return res.status(201).json({ message: 'Employee added successfully.' });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
