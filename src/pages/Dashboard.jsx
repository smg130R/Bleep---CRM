import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  Phone, PhoneIncoming, UserPlus, ShoppingBag, CreditCard,
  AlertTriangle, TrendingUp, DollarSign, Users, Image, Loader,
  BarChart3, Calendar, Clock, Activity, Target, ArrowUpRight,
  ArrowDownRight, RefreshCw, Download, Filter
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const cardColor = (label) => {
  const map = {
    calls: 'blue', connects: 'green', rate: 'teal', prospects: 'orange',
    followups: 'purple', deals: 'green', revenue: 'indigo', screenshots: 'teal',
    sCalls: 'indigo',
  };
  return map[label] || 'blue';
};

const Dashboard = ({ dateFilter }) => {
  const { user } = useAuth();
  const role = user?.role;
  const isBDA = role === 'bda';
  const isTL = role === 'team_lead';

  const [stats, setStats] = useState({ calls: 0, connects: 0, screenshots: 0, prospects: 0, deals: 0, score: 0, sCalls: 0 });
  const [chartData, setChartData] = useState([]);
  const [lowPerf, setLowPerf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payStats, setPayStats] = useState({ total: 0, slotBookingCount: 0, totalSlotAmount: 0, totalCollected: 0, totalOutstanding: 0 });
  const [unassignedCount, setUnassignedCount] = useState(0);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const [kpiRes, lbRes, psRes, ucRes] = await Promise.all([
        fetch(`/api/kpi/dashboard?date=${today}`),
        fetch(`/api/kpi/leaderboard?date=${today}`),
        fetch('/api/prospects/stats'),
        fetch('/api/team-lead/unassigned-count'),
      ]);
      if (kpiRes.ok) { const d = await kpiRes.json(); setStats(d.stats); if (d.chartData) setChartData(d.chartData); }
      if (lbRes.ok) { const d = await lbRes.json(); setLowPerf((d.leaderboard || []).filter(b => b.perfScore < 40)); }
      if (psRes.ok) { setPayStats(await psRes.json()); }
      if (ucRes.ok) { const d = await ucRes.json(); setUnassignedCount(d.count || 0); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, [role, dateFilter]);

  const lineData = {
    labels: chartData.map(c => c.date?.slice(5) || ''),
    datasets: [
      { label: 'Calls', data: chartData.map(c => c.totalCalls), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.06)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 3 },
      { label: 'Connects', data: chartData.map(c => c.totalConnects), borderColor: '#16A34A', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2, borderDash: [4, 4], pointRadius: 2 },
    ],
  };

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true } } },
    scales: { y: { beginAtZero: true, min: 0, grid: { color: '#F1F5F9' } }, x: { grid: { display: false } } },
  };

  const connRate = stats.calls > 0 ? ((stats.connects / stats.calls) * 100).toFixed(1) : 0;
  const prevRate = stats.calls > 0 ? 0 : 0;

  const kpiCards = [
    { key: 'calls', label: isBDA ? 'My Calls' : 'Team Calls', value: stats.calls, icon: Phone, trend: '+12%', color: 'blue' },
    { key: 'connects', label: 'Connected', value: stats.connects, icon: PhoneIncoming, trend: '+8%', color: 'green' },
    { key: 'rate', label: 'Connection Rate', value: `${connRate}%`, icon: TrendingUp, trend: '', color: 'teal', small: true },
    { key: 'prospects', label: 'Prospects', value: stats.prospects, icon: UserPlus, trend: '+5%', color: 'orange' },
    { key: 'screenshots', label: 'Screenshots', value: stats.screenshots, icon: Image, trend: '', color: 'teal' },
    { key: 'sCalls', label: 'Sales Calls', value: stats.sCalls, icon: Phone, trend: '', color: 'indigo' },
    { key: 'deals', label: 'Deals Closed', value: stats.deals, icon: ShoppingBag, trend: '+3%', color: 'green' },
  ];

  return (
    <div className="view-section active" style={{ gap: 20 }}>
      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          {greet()}, {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>
          Here's your performance overview for today.
        </p>
      </div>

      {/* Low Fresh Leads Warning */}
      {!isBDA && unassignedCount < 150 && (
        <div style={{
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: 12,
          color: 'var(--danger)', fontWeight: 600, fontSize: 14,
        }}>
          <AlertTriangle size={20} />
          <span>Low fresh leads: only <strong>{unassignedCount}</strong> unassigned remaining.
          {unassignedCount === 0 ? ' Import new leads from the master sheet ASAP!' : ' Consider importing more leads soon.'}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {loading ? Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="kpi-card" style={{ opacity: 0.5 }}>
            <div style={{ height: 14, width: '60%', background: 'var(--border)', borderRadius: 6, marginBottom: 16 }} />
            <div style={{ height: 32, width: '50%', background: 'var(--border)', borderRadius: 8, marginBottom: 8 }} />
            <div style={{ height: 12, width: '40%', background: 'var(--border)', borderRadius: 6 }} />
          </div>
        )) : kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.key} className={`kpi-card ${cardColor(card.key)}`} style={{ '--card-accent': 'var(--primary)' }}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">{card.label}</span>
                <div className="kpi-card-icon"><Icon size={18} /></div>
              </div>
              <div className="kpi-card-value" style={card.small ? { fontSize: 24 } : {}}>{card.value}</div>
              <div className="kpi-card-footer">
                {card.trend && (
                  <span className="kpi-trend up">
                    <ArrowUpRight size={14} /> {card.trend}
                  </span>
                )}
                <span>vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="dashboard-charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Outbound Connection Trend</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}><Download size={14} /> Export</button>
              <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={fetchData}><RefreshCw size={14} /></button>
            </div>
          </div>
          <div className="chart-container" style={{ height: 280 }}>
            <Line data={lineData} options={lineOpts} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3>Division Performance</h3>
            <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}><Filter size={14} /> This Week</button>
          </div>
          <div className="chart-container" style={{ height: 280 }}>
            <Bar data={{
              labels: ['Calls', 'Connects', 'Deals'],
              datasets: [{
                label: 'You', data: [stats.calls, stats.connects, stats.deals],
                backgroundColor: '#2563EB', borderRadius: 6, borderSkipped: false,
              }],
            }} options={{
              ...lineOpts,
              plugins: { legend: { display: false } },
            }} />
          </div>
        </div>
      </div>

      {/* BDA Payment Row */}
      {isBDA && (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <div className="kpi-card blue">
            <div className="kpi-card-header"><span className="kpi-card-title">Total Prospects</span><Users size={18} /></div>
            <div className="kpi-card-value">{payStats.total}</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-card-header"><span className="kpi-card-title">Slot Bookings</span><CreditCard size={18} /></div>
            <div className="kpi-card-value">{payStats.slotBookingCount}</div>
            <div className="kpi-card-footer">₹{(payStats.totalSlotAmount || 0).toLocaleString()} total</div>
          </div>
          <div className="kpi-card orange">
            <div className="kpi-card-header"><span className="kpi-card-title">Collected</span><DollarSign size={18} /></div>
            <div className="kpi-card-value">₹{(payStats.totalCollected || 0).toLocaleString()}</div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-card-header"><span className="kpi-card-title">Outstanding</span><BarChart3 size={18} /></div>
            <div className="kpi-card-value">₹{(payStats.totalOutstanding || 0).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Low Performance */}
      {!isBDA && lowPerf.length > 0 && (
        <div className="content-card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
              <span className="card-title">Low Performance Alerts</span>
            </div>
            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>View All</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>BDA Name</th>
                  <th>Team</th>
                  <th>Calls</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowPerf.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>Team {b.teamId}</td>
                    <td>{b.totalCalls}</td>
                    <td>
                      <div className="table-progress-wrapper">
                        <div className="table-progress-bg">
                          <div className="table-progress-bar red" style={{ width: `${b.perfScore}%` }} />
                        </div>
                        <span className="table-progress-text">{b.perfScore}%</span>
                      </div>
                    </td>
                    <td><span className="badge needs-push">Needs Push</span></td>
                    <td><button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>Ping Lead</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
