import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { 
  Phone, 
  PhoneIncoming, 
  UserPlus, 
  Calendar, 
  ShoppingBag, 
  CreditCard,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Image
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ dateFilter }) => {
  const { user } = useAuth();
  const currentRole = user?.role;

  const [stats, setStats] = useState({
    calls: 0,
    connects: 0,
    screenshots: 0,
    prospects: 0,
    deals: 0,
    score: 0
  });

  const [chartData, setChartData] = useState([]);
  const [lowPerformanceList, setLowPerformanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStats, setPaymentStats] = useState({ total: 0, slotBookingCount: 0, totalSlotAmount: 0, totalCollected: 0, totalOutstanding: 0 });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/kpi/dashboard?date=${new Date().toISOString().split('T')[0]}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        if (data.chartData) setChartData(data.chartData);
      }

      // Fetch leaderboard for low performance warnings (score < 40)
      const lbRes = await fetch(`/api/kpi/leaderboard?date=${new Date().toISOString().split('T')[0]}`);
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        const lowBDAs = lbData.leaderboard.filter(bda => bda.perfScore < 40);
        setLowPerformanceList(lowBDAs);
      }

      // Fetch payment stats for BDA
      const psRes = await fetch('/api/prospects/stats');
      if (psRes.ok) {
        const psData = await psRes.json();
        setPaymentStats(psData);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentRole, dateFilter]);

  // Adjust displays based on role
  const isBDA = currentRole === 'bda';
  const isTL = currentRole === 'team_lead';

  // Format revenue helper
  const getRevenue = () => {
    if (stats.deals) return `₹${(stats.deals * 0.125).toFixed(2)}L`;
    return '₹0.00L';
  };

  // Setup Chart JS datasets
  const lineChartData = {
    labels: chartData.length ? chartData.map(c => c.date.split('-').slice(1).join('/')) : [],
    datasets: [
      {
        label: "Marketing Calls",
        data: chartData.length ? chartData.map(c => c.totalCalls) : [],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        fill: true,
        tension: 0.4,
        borderWidth: 3
      },
      {
        label: "Connects",
        data: chartData.length ? chartData.map(c => c.totalConnects) : [],
        borderColor: "#10b981",
        backgroundColor: "transparent",
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5]
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { font: { family: "Inter", weight: 600 } } }
    },
    scales: {
      y: { grid: { color: "#e2e8f0" } },
      x: { grid: { display: false } }
    }
  };

  const barChartData = {
    labels: [],
    datasets: [
      { label: "Calls Made", data: [], backgroundColor: "#3b82f6", borderRadius: 6 },
      { label: "Connected Calls", data: [], backgroundColor: "#10b981", borderRadius: 6 }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { font: { family: "Inter", weight: 600 } } }
    },
    scales: {
      y: { grid: { color: "#e2e8f0" } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="view-section active" id="dashboard-view">
      {/* Role Banner */}
      <div className="role-welcome-banner">
        <h2 id="role-banner-title">
          {isBDA && "BDA Sales Portal"}
          {isTL && `Team Division Overview`}
          {!isBDA && !isTL && "Bleep CRM Dashboard"}
        </h2>
        <p id="role-banner-desc">
          {isBDA && "Manage your assigned customer calling logs. Update customer status tags directly to synchronize data with management."}
          {isTL && "Review MC1 (11-2), MC2 (3:15-5), and Sales/Follow-up (5+) slot performance for BDA teams."}
          {!isBDA && !isTL && "Welcome. Monitor business intelligence KPI dashboards, manage team corporate roles, and analyze sync triggers."}
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="dashboard-grid" id="dashboard-kpi-cards">
        <div className="kpi-card blue">
          <div className="kpi-card-header">
            <span className="kpi-card-title">{isBDA ? "My Total Calls" : isTL ? "Team Calls" : "Total Marketing Calls"}</span>
            <div className="kpi-card-icon"><Phone size={18} /></div>
          </div>
          <div className="kpi-card-value">{stats.calls ?? 0}</div>
          <div className="kpi-card-footer">
            <span className="kpi-trend up"><TrendingUp size={14} /> today</span>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Connected Calls</span>
            <div className="kpi-card-icon"><PhoneIncoming size={18} /></div>
          </div>
          <div className="kpi-card-value">{stats.connects ?? 0}</div>
          <div className="kpi-card-footer">
            <span className="kpi-trend">
              {stats.calls > 0 ? (((stats.connects ?? 0) / stats.calls) * 100).toFixed(1) : 0}% connection rate
            </span>
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Prospects Created</span>
            <div className="kpi-card-icon"><UserPlus size={18} /></div>
          </div>
          <div className="kpi-card-value">{stats.prospects ?? 0}</div>
          <div className="kpi-card-footer">
            {stats.followups || stats.deals ? "Follow-ups due today" : "No follow-ups due"}
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-card-header">
            <span className="kpi-card-title">{isBDA ? "My Deals Closed" : isTL ? "Team Closed Deals" : "Deals Closed"}</span>
            <div className="kpi-card-icon"><ShoppingBag size={18} /></div>
          </div>
          <div className="kpi-card-value">{stats.deals ?? 0}</div>
          <div className="kpi-card-footer">
            <span className="kpi-trend up">{getRevenue()} Revenue Logged</span>
          </div>
        </div>
      </div>

      {/* Payment Tracking for BDA */}
      {isBDA && (
        <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
          <div className="kpi-card blue">
            <div className="kpi-card-header"><span className="kpi-card-title">Total Prospects</span><Users size={18} /></div>
            <div className="kpi-card-value">{paymentStats.total}</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-card-header"><span className="kpi-card-title">Slot Bookings</span><CreditCard size={18} /></div>
            <div className="kpi-card-value">{paymentStats.slotBookingCount}</div>
            <div className="kpi-card-footer">₹{(paymentStats.totalSlotAmount || 0).toLocaleString()} total</div>
          </div>
          <div className="kpi-card orange">
            <div className="kpi-card-header"><span className="kpi-card-title">Amount Collected</span><DollarSign size={18} /></div>
            <div className="kpi-card-value">₹{(paymentStats.totalCollected || 0).toLocaleString()}</div>
          </div>
          <div className="kpi-card purple">
            <div className="kpi-card-header"><span className="kpi-card-title">Screenshot Shared</span><Image size={18} /></div>
            <div className="kpi-card-value">{stats.screenshots ?? 0}</div>
            <div className="kpi-card-footer">today</div>
          </div>
        </div>
      )}

      {/* Main Charts & Analytics panel */}
      <div className="dashboard-charts-grid" style={{ marginTop: '2rem' }}>
        <div className="chart-card">
          <div className="chart-header">
            <h3>Outbound Connection Progress</h3>
          </div>
          <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {!isBDA && (
          <div className="chart-card">
            <div className="chart-header">
              <h3>Division Call Comparison</h3>
            </div>
            <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Low Performance Warning alerts list */}
      {!isBDA && (
        <div className="content-card" style={{ marginTop: '2rem' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Low Performance Deficit Alerts</h3>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>BDA Name</th>
                  <th>Team Lead</th>
                  <th>Calls Made</th>
                  <th>Performance Score</th>
                  <th>Status Tag</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="low-performance-alerts-tbody">
                {lowPerformanceList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No performance warnings. All agents exceed standards!
                    </td>
                  </tr>
                ) : (
                  lowPerformanceList.map(bda => (
                    <tr key={bda.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{bda.name}</td>
                      <td>{bda.teamId ? `Team ${bda.teamId}` : 'Management'}</td>
                      <td>{bda.totalCalls} Calls</td>
                      <td>
                        <div className="table-progress-wrapper">
                          <div className="table-progress-bg">
                            <div className="table-progress-bar red" style={{ width: `${bda.perfScore}%` }}></div>
                          </div>
                          <span className="table-progress-text">{bda.perfScore}%</span>
                        </div>
                      </td>
                      <td><span className="badge needs-push">Needs Push</span></td>
                      <td>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => alert(`Coaching notification sent to Team Lead of ${bda.name}.`)}
                        >
                          Ping Lead
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
