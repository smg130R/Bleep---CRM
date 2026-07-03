const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken } = require('../middleware/auth');

// GET /api/kpi/dashboard - General summary stats
router.get('/dashboard', authenticateToken, async (req, res) => {
  const dateFilter = req.query.date || new Date().toISOString().split('T')[0];

  try {
    let stats = { calls: 0, connects: 0, screenshots: 0, prospects: 0, deals: 0, score: 0 };
    let chartData = [];

    if (req.user.role === 'admin' || req.user.role === 'ops_head') {
      // Company-wide summary for the date
      const { data: rows, error } = await supabase
        .from('kpi_records')
        .select('mCalls, mConn, mSS, mPros, eCalls, eConn, eSS, ePros, deals, perfScore')
        .eq('date', dateFilter);

      if (error) throw error;

      if (rows && rows.length > 0) {
        let totalScore = 0;
        rows.forEach(r => {
          stats.calls += (r.mCalls + r.eCalls);
          stats.connects += (r.mConn + r.eConn);
          stats.screenshots += (r.mSS + r.eSS);
          stats.prospects += (r.mPros + r.ePros);
          stats.deals += r.deals;
          totalScore += r.perfScore;
        });
        stats.score = parseFloat((totalScore / rows.length).toFixed(2));
      }

      // Chart: last 7 dates aggregated
      const { data: chart } = await supabase
        .from('kpi_records')
        .select('date, mCalls, eCalls, mConn, eConn, deals')
        .order('date', { ascending: false })
        .limit(56); // ~8 BDAs × 7 days

      if (chart) {
        const dateMap = {};
        chart.forEach(r => {
          if (!dateMap[r.date]) dateMap[r.date] = { date: r.date, totalDeals: 0, totalCalls: 0, totalConnects: 0 };
          dateMap[r.date].totalDeals += r.deals;
          dateMap[r.date].totalCalls += (r.mCalls + r.eCalls);
          dateMap[r.date].totalConnects += (r.mConn + r.eConn);
        });
        chartData = Object.values(dateMap)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7);
      }

    } else if (req.user.role === 'team_lead') {
      // Get BDA ids in this team
      const { data: bdas } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'bda')
        .eq('teamId', req.user.teamId);

      const bdaIds = (bdas || []).map(b => b.id);

      const { data: rows, error } = await supabase
        .from('kpi_records')
        .select('mCalls, mConn, mSS, mPros, eCalls, eConn, eSS, ePros, deals, perfScore')
        .eq('date', dateFilter)
        .in('userId', bdaIds.length ? bdaIds : [0]);

      if (error) throw error;

      if (rows && rows.length > 0) {
        let totalScore = 0;
        rows.forEach(r => {
          stats.calls += (r.mCalls + r.eCalls);
          stats.connects += (r.mConn + r.eConn);
          stats.screenshots += (r.mSS + r.eSS);
          stats.prospects += (r.mPros + r.ePros);
          stats.deals += r.deals;
          totalScore += r.perfScore;
        });
        stats.score = parseFloat((totalScore / rows.length).toFixed(2));
      }

      // Chart
      const { data: chart } = await supabase
        .from('kpi_records')
        .select('date, mCalls, eCalls, mConn, eConn, deals')
        .in('userId', bdaIds.length ? bdaIds : [0])
        .order('date', { ascending: false })
        .limit(56);

      if (chart) {
        const dateMap = {};
        chart.forEach(r => {
          if (!dateMap[r.date]) dateMap[r.date] = { date: r.date, totalDeals: 0, totalCalls: 0, totalConnects: 0 };
          dateMap[r.date].totalDeals += r.deals;
          dateMap[r.date].totalCalls += (r.mCalls + r.eCalls);
          dateMap[r.date].totalConnects += (r.mConn + r.eConn);
        });
        chartData = Object.values(dateMap)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7);
      }

    } else if (req.user.role === 'bda') {
      const { data: row, error } = await supabase
        .from('kpi_records')
        .select('mCalls, mConn, mSS, mPros, eCalls, eConn, eSS, ePros, deals, perfScore')
        .eq('userId', req.user.id)
        .eq('date', dateFilter)
        .single();

      if (!error && row) {
        stats = {
          calls: row.mCalls + row.eCalls,
          connects: row.mConn + row.eConn,
          screenshots: row.mSS + row.eSS,
          prospects: row.mPros + row.ePros,
          deals: row.deals,
          score: row.perfScore
        };
      }

      // Chart
      const { data: chart } = await supabase
        .from('kpi_records')
        .select('date, mCalls, eCalls, mConn, eConn, deals')
        .eq('userId', req.user.id)
        .order('date', { ascending: false })
        .limit(7);

      if (chart) {
        chartData = chart.map(r => ({
          date: r.date,
          totalDeals: r.deals,
          totalCalls: r.mCalls + r.eCalls,
          totalConnects: r.mConn + r.eConn
        })).reverse();
      }
    }

    // Add prospect counts from prospects table
    let prospectStats = { total: 0, registered: 0, converted: 0 };

    if (req.user.role === 'admin' || req.user.role === 'ops_head') {
      const { data: allPros } = await supabase.from('prospects').select('status');
      if (allPros) {
        prospectStats.total = allPros.length;
        prospectStats.registered = allPros.filter(p => p.status === 'Registration Done').length;
        prospectStats.converted = allPros.filter(p => p.status === 'Converted').length;
      }
    } else if (req.user.role === 'team_lead' && req.user.teamId) {
      const { data: bdas } = await supabase.from('users').select('id').eq('teamId', req.user.teamId).eq('role', 'bda');
      const bdaIds = (bdas || []).map(b => b.id);
      if (bdaIds.length > 0) {
        const { data: teamPros } = await supabase.from('prospects').select('status').in('bdaId', bdaIds);
        if (teamPros) {
          prospectStats.total = teamPros.length;
          prospectStats.registered = teamPros.filter(p => p.status === 'Registration Done').length;
          prospectStats.converted = teamPros.filter(p => p.status === 'Converted').length;
        }
      }
    } else if (req.user.role === 'bda') {
      const { data: myPros } = await supabase.from('prospects').select('status').eq('bdaId', req.user.id);
      if (myPros) {
        prospectStats.total = myPros.length;
        prospectStats.registered = myPros.filter(p => p.status === 'Registration Done').length;
        prospectStats.converted = myPros.filter(p => p.status === 'Converted').length;
      }
    }

    stats.totalProspects = prospectStats.total;
    stats.registeredProspects = prospectStats.registered;
    stats.convertedProspects = prospectStats.converted;

    return res.json({ stats, chartData });
  } catch (error) {
    console.error('Get KPI stats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/kpi/leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  const dateFilter = req.query.date || new Date().toISOString().split('T')[0];

  try {
    let leaderboard;

    if (['admin', 'ops_head', 'hr'].includes(req.user.role)) {
      const { data, error } = await supabase
        .from('kpi_records')
        .select('perfScore, deals, mCalls, eCalls, userId, users(id, name, teamId)')
        .eq('date', dateFilter)
        .order('perfScore', { ascending: false })
        .order('deals', { ascending: false })
        .limit(10);

      if (error) throw error;

      leaderboard = (data || []).map(r => ({
        id: r.users?.id,
        name: r.users?.name,
        teamId: r.users?.teamId,
        perfScore: r.perfScore,
        deals: r.deals,
        totalCalls: (r.mCalls + r.eCalls)
      }));
    } else {
      const teamId = req.user.teamId || 'Alpha';
      const { data: bdas } = await supabase
        .from('users')
        .select('id')
        .eq('teamId', teamId);

      const bdaIds = (bdas || []).map(b => b.id);

      const { data, error } = await supabase
        .from('kpi_records')
        .select('perfScore, deals, mCalls, eCalls, userId, users(id, name, teamId)')
        .eq('date', dateFilter)
        .in('userId', bdaIds.length ? bdaIds : [0])
        .order('perfScore', { ascending: false })
        .order('deals', { ascending: false });

      if (error) throw error;

      leaderboard = (data || []).map(r => ({
        id: r.users?.id,
        name: r.users?.name,
        teamId: r.users?.teamId,
        perfScore: r.perfScore,
        deals: r.deals,
        totalCalls: (r.mCalls + r.eCalls)
      }));
    }

    return res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/kpi/board-all - Full KPI table for KPI Board tab
router.get('/board-all', authenticateToken, async (req, res) => {
  const dateFilter = req.query.date || new Date().toISOString().split('T')[0];

  try {
    let bdaQuery = supabase
      .from('users')
      .select('id, name, teamId')
      .eq('role', 'bda');

    if (req.user.role === 'team_lead') {
      bdaQuery = bdaQuery.eq('teamId', req.user.teamId);
    } else if (req.user.role === 'bda') {
      bdaQuery = bdaQuery.eq('id', req.user.id);
    }

    const { data: bdas, error: bdaErr } = await bdaQuery;
    if (bdaErr) throw bdaErr;

    const bdaIds = (bdas || []).map(b => b.id);

    const { data: kpis, error: kpiErr } = await supabase
      .from('kpi_records')
      .select('userId, mCalls, mConn, mSS, mPros, eCalls, eConn, eSS, ePros, deals, followups, perfScore')
      .eq('date', dateFilter)
      .in('userId', bdaIds.length ? bdaIds : [0]);

    if (kpiErr) throw kpiErr;

    // Get team leads map
    const { data: leads } = await supabase
      .from('users')
      .select('name, teamId')
      .eq('role', 'team_lead');

    const leadMap = {};
    (leads || []).forEach(l => { leadMap[l.teamId] = l.name; });

    const kpiMap = {};
    (kpis || []).forEach(k => { kpiMap[k.userId] = k; });

    const records = (bdas || []).map(u => {
      const k = kpiMap[u.id] || {};
      return {
        bdaName: u.name,
        team: u.teamId,
        teamLead: leadMap[u.teamId] || null,
        mCalls: k.mCalls ?? null,
        mConn: k.mConn ?? null,
        mSS: k.mSS ?? null,
        mPros: k.mPros ?? null,
        eCalls: k.eCalls ?? null,
        eConn: k.eConn ?? null,
        eSS: k.eSS ?? null,
        ePros: k.ePros ?? null,
        deals: k.deals ?? null,
        followups: k.followups ?? null,
        perfScore: k.perfScore ?? null
      };
    });

    return res.json({ records });
  } catch (error) {
    console.error('Get board all error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/kpi/teams-breakdown - Per-team aggregated stats for chart
router.get('/teams-breakdown', authenticateToken, async (req, res) => {
  const dateFilter = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const { data: teams } = await supabase.from('teams').select('id, name');
    if (!teams) return res.json({ teams: [] });

    const result = [];
    for (const team of teams) {
      const { data: bdas } = await supabase.from('users').select('id').eq('role', 'bda').eq('teamId', team.id);
      const ids = (bdas || []).map(b => b.id);
      if (ids.length === 0) continue;

      const { data: rows } = await supabase
        .from('kpi_records')
        .select('mCalls, eCalls, mConn, eConn, deals, perfScore')
        .eq('date', dateFilter)
        .in('userId', ids);

      let calls = 0, connects = 0, deals = 0, score = 0;
      (rows || []).forEach(r => {
        calls += (r.mCalls || 0) + (r.eCalls || 0);
        connects += (r.mConn || 0) + (r.eConn || 0);
        deals += r.deals || 0;
        score += r.perfScore || 0;
      });

      result.push({
        id: team.id,
        name: team.name,
        calls,
        connects,
        deals,
        score: rows?.length ? parseFloat((score / rows.length).toFixed(2)) : 0,
        memberCount: ids.length,
      });
    }

    // Also add a "by member" section for current team if TL
    let breakdownBy;
    if (req.user.role === 'team_lead' && req.user.teamId) {
      const { data: bdas } = await supabase.from('users').select('id, name').eq('role', 'bda').eq('teamId', req.user.teamId);
      const ids = (bdas || []).map(b => b.id);
      const { data: rows } = await supabase
        .from('kpi_records')
        .select('userId, mCalls, eCalls, mConn, eConn, deals, perfScore')
        .eq('date', dateFilter)
        .in('userId', ids.length ? ids : [0]);
      const kpiMap = {};
      (rows || []).forEach(r => { kpiMap[r.userId] = r; });
      breakdownBy = (bdas || []).map(b => {
        const k = kpiMap[b.id] || {};
        return { id: b.id, name: b.name, calls: (k.mCalls||0)+(k.eCalls||0), connects: (k.mConn||0)+(k.eConn||0), deals: k.deals||0, perfScore: k.perfScore||0 };
      });
    }

    return res.json({ teams: result, breakdownBy });
  } catch (error) {
    console.error('Teams breakdown error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/kpi/team-members/:teamId - Per-BDA stats within a team
router.get('/team-members/:teamId', authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  const dateFilter = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const { data: bdas } = await supabase.from('users').select('id, name').eq('role', 'bda').eq('teamId', teamId);
    if (!bdas || bdas.length === 0) return res.json({ members: [] });

    const ids = bdas.map(b => b.id);
    const { data: rows } = await supabase
      .from('kpi_records')
      .select('userId, mCalls, mConn, mSS, mPros, eCalls, eConn, eSS, ePros, deals, followups, perfScore')
      .eq('date', dateFilter)
      .in('userId', ids);

    const kpiMap = {};
    (rows || []).forEach(r => { kpiMap[r.userId] = r; });

    const members = bdas.map(b => {
      const k = kpiMap[b.id] || {};
      return {
        id: b.id,
        name: b.name,
        mCalls: k.mCalls ?? 0, mConn: k.mConn ?? 0, mSS: k.mSS ?? 0, mPros: k.mPros ?? 0,
        eCalls: k.eCalls ?? 0, eConn: k.eConn ?? 0, eSS: k.eSS ?? 0, ePros: k.ePros ?? 0,
        deals: k.deals ?? 0, followups: k.followups ?? 0, perfScore: k.perfScore ?? 0,
      };
    });

    return res.json({ members });
  } catch (error) {
    console.error('Team members error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
