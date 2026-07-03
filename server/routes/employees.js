const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/employees - All employees (Admin, HR, Ops Head, Team Lead)
router.get('/', authenticateToken, requireRoles(['admin', 'hr', 'ops_head', 'team_lead']), async (req, res) => {
  try {
    const fields = 'id, name, email, role, phone, teamId, joinedDate, status, employeeCode';
    let query = supabase.from('users').select(fields);

    // Team leads only see their own team
    if (req.user.role === 'team_lead') {
      query = query.eq('teamId', req.user.teamId);
    }

    query = query.order('role').order('name');
    const { data, error } = await query;

    if (error) {
      // employeeCode column may not exist yet — fall back
      const fallbackFields = 'id, name, email, role, phone, teamId, joinedDate, status';
      let fb = supabase.from('users').select(fallbackFields);
      if (req.user.role === 'team_lead') fb = fb.eq('teamId', req.user.teamId);
      const { data: fallback, error: fallbackErr } = await fb.order('role').order('name');
      if (fallbackErr) throw fallbackErr;
      return res.json({ employees: fallback });
    }
    return res.json({ employees: data });
  } catch (error) {
    console.error('Get employees error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/employees/next-code - Suggest next employee code
router.get('/next-code', authenticateToken, async (req, res) => {
  try {
    const prefix = req.query.prefix || 'AD';
    const { data: codes } = await supabase
      .from('users')
      .select('employeeCode')
      .not('employeeCode', 'is', null)
      .order('employeeCode', { ascending: false })
      .limit(1);
    const lastCode = codes?.[0]?.employeeCode || '';
    const lastNum = parseInt(lastCode.replace(/^.*?(\d+)$/, '$1'), 10) || 0;
    const nextCode = prefix + '-' + String(lastNum + 1).padStart(3, '0');
    return res.json({ nextCode });
  } catch (error) {
    // If employeeCode column doesn't exist, return default
    return res.json({ nextCode: 'AD-001' });
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
  const { name, email, role, phone, teamId, teamName, password, employeeCode } = req.body;
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

    // The handle_new_user trigger already inserted the row; fetch it
    const { data: existing, error: fetchErr } = await supabase
      .from('users')
      .select('id')
      .eq('authId', authData.user.id);

    let userRow;
    if (!fetchErr && existing && existing.length > 0) {
      userRow = existing[0];
    } else {
      // Trigger may not exist — insert manually
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
      userRow = newUser[0];
    }

    const newUserId = userRow.id;

    // Assign employeeCode (or auto-generate if not provided)
    let code = employeeCode;
    if (!code) {
      const { data: codes, error: codeErr } = await supabase
        .from('users')
        .select('employeeCode')
        .not('employeeCode', 'is', null)
        .order('employeeCode', { ascending: false })
        .limit(1);
      if (codeErr) {
        console.error('Fetch max employeeCode error:', codeErr.message);
        code = 'AD-001';
      } else {
        const last = codes?.[0]?.employeeCode || '';
        const n = parseInt(last.replace(/^.*?(\d+)$/, '$1'), 10) || 0;
        code = 'AD-' + String(n + 1).padStart(3, '0');
      }
    }
    const { error: updateErr } = await supabase
      .from('users')
      .update({ employeeCode: code })
      .eq('id', newUserId);
    if (updateErr) console.error('Assign employeeCode error:', updateErr.message);

    // If creating a team lead with a team name, create the team record
    if (role === 'team_lead' && req.body.teamName && newUserId) {
      const teamId = req.body.teamName.replace(/\s+/g, '');
      const { error: teamErr } = await supabase.from('teams').insert({
        id: teamId,
        name: req.body.teamName,
        leadId: newUserId
      });

      if (teamErr) {
        console.error('Create team error:', teamErr.message);
      } else {
        await supabase.from('users').update({ teamId }).eq('id', newUserId);
      }
    }

    return res.status(201).json({ message: 'Employee added successfully.' });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
