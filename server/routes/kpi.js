const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/kpi/dashboard - General summary stats
router.get('/dashboard', authenticateToken, async (req, res) => {
  const dateFilter = req.query.date || new Date().toISOString().split('T')[0];

  try {
    let stats = { calls: 0, connects: 0, screenshots: 0, prospects: 0, deals: 0, score: 0, sCalls: 0 };
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
          stats.screenshots += r.mSS;
          stats.prospects += (r.mPros + r.ePros);
          stats.deals += r.deals;
          stats.sCalls += (r.eSS || 0);
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
          screenshots: row.mSS,
          prospects: row.mPros + row.ePros,
          deals: row.deals,
          score: row.perfScore,
          sCalls: row.eSS || 0
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

function getDateRange(range) {
  const today = new Date().toISOString().split('T')[0];
  if (range === 'weekly') {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return { dates };
  }
  if (range === 'monthly') {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return { dates };
  }
  return { dates: [today] };
}

// GET /api/kpi/teams-breakdown - Per-team aggregated stats for chart
router.get('/teams-breakdown', authenticateToken, async (req, res) => {
  const range = req.query.range || 'today';
  const { dates } = getDateRange(range);
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
        .in('userId', ids)
        .in('date', dates);

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

    let breakdownBy;
    if (req.user.role === 'team_lead' && req.user.teamId) {
      const { data: bdas } = await supabase.from('users').select('id, name').eq('role', 'bda').eq('teamId', req.user.teamId);
      const ids = (bdas || []).map(b => b.id);
      const { data: rows } = await supabase
        .from('kpi_records')
        .select('userId, mCalls, eCalls, mConn, eConn, deals, perfScore')
        .in('userId', ids.length ? ids : [0])
        .in('date', dates);
      const kpiMap = {};
      (rows || []).forEach(r => {
        if (!kpiMap[r.userId]) kpiMap[r.userId] = { mCalls:0, eCalls:0, mConn:0, eConn:0, deals:0, perfScore:0 };
        kpiMap[r.userId].mCalls += r.mCalls || 0;
        kpiMap[r.userId].eCalls += r.eCalls || 0;
        kpiMap[r.userId].mConn += r.mConn || 0;
        kpiMap[r.userId].eConn += r.eConn || 0;
        kpiMap[r.userId].deals += r.deals || 0;
        kpiMap[r.userId].perfScore = Math.max(kpiMap[r.userId].perfScore, r.perfScore || 0);
      });
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
  const range = req.query.range || 'today';
  const { dates } = getDateRange(range);
  try {
    const { data: bdas } = await supabase.from('users').select('id, name').eq('role', 'bda').eq('teamId', teamId);
    if (!bdas || bdas.length === 0) return res.json({ members: [] });

    const ids = bdas.map(b => b.id);
    const { data: rows } = await supabase
      .from('kpi_records')
      .select('userId, mCalls, mConn, mSS, mPros, eCalls, eConn, eSS, ePros, deals, followups, perfScore')
      .in('userId', ids)
      .in('date', dates);

    const kpiMap = {};
    (rows || []).forEach(r => {
      if (!kpiMap[r.userId]) kpiMap[r.userId] = { mCalls:0, mConn:0, mSS:0, mPros:0, eCalls:0, eConn:0, eSS:0, ePros:0, deals:0, followups:0, perfScore:0 };
      kpiMap[r.userId].mCalls += r.mCalls ?? 0;
      kpiMap[r.userId].mConn += r.mConn ?? 0;
      kpiMap[r.userId].mSS += r.mSS ?? 0;
      kpiMap[r.userId].mPros += r.mPros ?? 0;
      kpiMap[r.userId].eCalls += r.eCalls ?? 0;
      kpiMap[r.userId].eConn += r.eConn ?? 0;
      kpiMap[r.userId].eSS += r.eSS ?? 0;
      kpiMap[r.userId].ePros += r.ePros ?? 0;
      kpiMap[r.userId].deals += r.deals ?? 0;
      kpiMap[r.userId].followups += r.followups ?? 0;
      kpiMap[r.userId].perfScore = Math.max(kpiMap[r.userId].perfScore, r.perfScore ?? 0);
    });

    const members = bdas.map(b => {
      const k = kpiMap[b.id] || {};
      return {
        id: b.id,
        name: b.name,
        mCalls: k.mCalls, mConn: k.mConn, mSS: k.mSS, mPros: k.mPros,
        eCalls: k.eCalls, eConn: k.eConn, eSS: k.eSS, ePros: k.ePros,
        deals: k.deals, followups: k.followups, perfScore: k.perfScore,
      };
    });

    return res.json({ members });
  } catch (error) {
    console.error('Team members error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/kpi/weekly - Last 7 days aggregated KPI per BDA
router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    const endDate = req.query.date || new Date().toISOString().split('T')[0];
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    const start = startDate.toISOString().split('T')[0];

    let bdaQuery = supabase.from('users').select('id, name, teamId').eq('role', 'bda');
    if (req.user.role === 'team_lead') {
      bdaQuery = bdaQuery.eq('teamId', req.user.teamId);
    } else if (req.user.role === 'bda') {
      bdaQuery = bdaQuery.eq('id', req.user.id);
    }
    const { data: bdas } = await bdaQuery;
    if (!bdas) return res.json({ records: [] });

    const ids = bdas.map(b => b.id);
    const { data: kpis } = await supabase
      .from('kpi_records')
      .select('userId, mCalls, mConn, mSS, mPros, eCalls, eConn, eSS, ePros, deals, perfScore, date')
      .in('userId', ids.length ? ids : [0])
      .gte('date', start)
      .lte('date', endDate);

    const kpiByUser = {};
    (kpis || []).forEach(k => {
      if (!kpiByUser[k.userId]) kpiByUser[k.userId] = [];
      kpiByUser[k.userId].push(k);
    });

    const records = bdas.map(b => {
      const days = kpiByUser[b.id] || [];
      let calls = 0, connects = 0, screenshots = 0, prospects = 0, deals = 0, scoreSum = 0, daysActive = 0;
      days.forEach(d => {
        calls += (d.mCalls || 0) + (d.eCalls || 0);
        connects += (d.mConn || 0) + (d.eConn || 0);
        screenshots += (d.mSS || 0) + (d.eSS || 0);
        prospects += (d.mPros || 0) + (d.ePros || 0);
        deals += d.deals || 0;
        if (d.deals > 0 || (d.mCalls || 0) + (d.eCalls || 0) > 0) {
          scoreSum += d.perfScore || 0;
          daysActive++;
        }
      });
      return {
        bdaId: b.id, bdaName: b.name, teamId: b.teamId,
        calls, connects, screenshots, prospects, deals,
        connectionRate: calls > 0 ? parseFloat(((connects / calls) * 100).toFixed(1)) : 0,
        avgPerfScore: daysActive > 0 ? parseFloat((scoreSum / daysActive).toFixed(2)) : 0,
        daysActive,
      };
    });

    return res.json({ records, startDate: start, endDate });
  } catch (error) {
    console.error('Weekly KPI error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/kpi/monthly - Last 30 days aggregated KPI per BDA
router.get('/monthly', authenticateToken, async (req, res) => {
  try {
    const endDate = req.query.date || new Date().toISOString().split('T')[0];
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 29);
    const start = startDate.toISOString().split('T')[0];

    let bdaQuery = supabase.from('users').select('id, name, teamId').eq('role', 'bda');
    if (req.user.role === 'team_lead') {
      bdaQuery = bdaQuery.eq('teamId', req.user.teamId);
    } else if (req.user.role === 'bda') {
      bdaQuery = bdaQuery.eq('id', req.user.id);
    }
    const { data: bdas } = await bdaQuery;
    if (!bdas) return res.json({ records: [] });

    const ids = bdas.map(b => b.id);
    const { data: kpis } = await supabase
      .from('kpi_records')
      .select('userId, mCalls, mConn, mSS, mPros, eCalls, eConn, eSS, ePros, deals, perfScore, date')
      .in('userId', ids.length ? ids : [0])
      .gte('date', start)
      .lte('date', endDate);

    const kpiByUser = {};
    (kpis || []).forEach(k => {
      if (!kpiByUser[k.userId]) kpiByUser[k.userId] = [];
      kpiByUser[k.userId].push(k);
    });

    const records = bdas.map(b => {
      const days = kpiByUser[b.id] || [];
      let calls = 0, connects = 0, screenshots = 0, prospects = 0, deals = 0, scoreSum = 0, daysActive = 0;
      days.forEach(d => {
        calls += (d.mCalls || 0) + (d.eCalls || 0);
        connects += (d.mConn || 0) + (d.eConn || 0);
        screenshots += (d.mSS || 0) + (d.eSS || 0);
        prospects += (d.mPros || 0) + (d.ePros || 0);
        deals += d.deals || 0;
        if (d.deals > 0 || (d.mCalls || 0) + (d.eCalls || 0) > 0) {
          scoreSum += d.perfScore || 0;
          daysActive++;
        }
      });
      return {
        bdaId: b.id, bdaName: b.name, teamId: b.teamId,
        calls, connects, screenshots, prospects, deals,
        connectionRate: calls > 0 ? parseFloat(((connects / calls) * 100).toFixed(1)) : 0,
        avgPerfScore: daysActive > 0 ? parseFloat((scoreSum / daysActive).toFixed(2)) : 0,
        daysActive,
      };
    });

    return res.json({ records, startDate: start, endDate });
  } catch (error) {
    console.error('Monthly KPI error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/kpi/hr-report - Combined weekly + monthly + funnel for HR
router.get('/hr-report', authenticateToken, requireRoles(['admin', 'hr', 'ops_head']), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);
    const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 29);

    const weekStart = weekAgo.toISOString().split('T')[0];
    const monthStart = monthAgo.toISOString().split('T')[0];

    const { data: bdas } = await supabase.from('users').select('id, name, teamId').eq('role', 'bda').eq('status', 'active');
    if (!bdas) return res.json({ weekly: [], monthly: [], funnel: [] });

    const ids = bdas.map(b => b.id);

    const { data: weeklyKpis } = await supabase
      .from('kpi_records')
      .select('userId, mCalls, mConn, mSS, mPros, eCalls, eConn, eSS, ePros, deals, perfScore')
      .in('userId', ids.length ? ids : [0])
      .gte('date', weekStart)
      .lte('date', today);

    const { data: monthlyKpis } = await supabase
      .from('kpi_records')
      .select('userId, mCalls, mConn, mSS, mPros, eCalls, eConn, eSS, ePros, deals, perfScore')
      .in('userId', ids.length ? ids : [0])
      .gte('date', monthStart)
      .lte('date', today);

    const aggregate = (kpis) => {
      const byUser = {};
      (kpis || []).forEach(k => {
        if (!byUser[k.userId]) byUser[k.userId] = { calls: 0, connects: 0, ss: 0, pros: 0, deals: 0, scoreSum: 0, days: 0 };
        byUser[k.userId].calls += (k.mCalls || 0) + (k.eCalls || 0);
        byUser[k.userId].connects += (k.mConn || 0) + (k.eConn || 0);
        byUser[k.userId].ss += (k.mSS || 0) + (k.eSS || 0);
        byUser[k.userId].pros += (k.mPros || 0) + (k.ePros || 0);
        byUser[k.userId].deals += k.deals || 0;
        if (k.deals > 0 || (k.mCalls || 0) + (k.eCalls || 0) > 0) {
          byUser[k.userId].scoreSum += k.perfScore || 0;
          byUser[k.userId].days++;
        }
      });
      return byUser;
    };

    const weeklyMap = aggregate(weeklyKpis);
    const monthlyMap = aggregate(monthlyKpis);

    const build = (map) => bdas.map(b => {
      const d = map[b.id] || { calls: 0, connects: 0, ss: 0, pros: 0, deals: 0, scoreSum: 0, days: 0 };
      return {
        bdaId: b.id, bdaName: b.name, teamId: b.teamId,
        calls: d.calls, connects: d.connects, screenshots: d.ss,
        prospects: d.pros, deals: d.deals,
        connectionRate: d.calls > 0 ? parseFloat(((d.connects / d.calls) * 100).toFixed(1)) : 0,
        avgPerfScore: d.days > 0 ? parseFloat((d.scoreSum / d.days).toFixed(2)) : 0,
        daysActive: d.days,
      };
    });

    // Funnel: overall conversion rates
    const totalWeek = Object.values(weeklyMap).reduce((s, d) => ({ calls: s.calls + d.calls, connects: s.connects + d.connects, pros: s.pros + d.pros, deals: s.deals + d.deals }), { calls: 0, connects: 0, pros: 0, deals: 0 });
    const totalMonth = Object.values(monthlyMap).reduce((s, d) => ({ calls: s.calls + d.calls, connects: s.connects + d.connects, pros: s.pros + d.pros, deals: s.deals + d.deals }), { calls: 0, connects: 0, pros: 0, deals: 0 });

    const funnel = {
      weekly: {
        calls: totalWeek.calls,
        connects: totalWeek.connects,
        connectRate: totalWeek.calls > 0 ? parseFloat(((totalWeek.connects / totalWeek.calls) * 100).toFixed(1)) : 0,
        prospects: totalWeek.pros,
        prospectRate: totalWeek.connects > 0 ? parseFloat(((totalWeek.pros / totalWeek.connects) * 100).toFixed(1)) : 0,
        deals: totalWeek.deals,
        dealRate: totalWeek.pros > 0 ? parseFloat(((totalWeek.deals / totalWeek.pros) * 100).toFixed(1)) : 0,
      },
      monthly: {
        calls: totalMonth.calls,
        connects: totalMonth.connects,
        connectRate: totalMonth.calls > 0 ? parseFloat(((totalMonth.connects / totalMonth.calls) * 100).toFixed(1)) : 0,
        prospects: totalMonth.pros,
        prospectRate: totalMonth.connects > 0 ? parseFloat(((totalMonth.pros / totalMonth.connects) * 100).toFixed(1)) : 0,
        deals: totalMonth.deals,
        dealRate: totalMonth.pros > 0 ? parseFloat(((totalMonth.deals / totalMonth.pros) * 100).toFixed(1)) : 0,
      },
    };

    return res.json({
      weekly: build(weeklyMap),
      monthly: build(monthlyMap),
      funnel,
      weekRange: `${weekStart} to ${today}`,
      monthRange: `${monthStart} to ${today}`,
    });
  } catch (error) {
    console.error('HR report error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
