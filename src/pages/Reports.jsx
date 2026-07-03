import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/kpi/dashboard', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartThemeColors = {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    purple: "#8b5cf6",
    coral: "#f97316",
    grid: "#e2e8f0"
  };

  if (loading) {
    return (
      <div className="view-section active" id="reports-view">
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="view-section active" id="reports-view">
      <div className="dashboard-charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
        
        <div className="chart-card">
          <div className="chart-header">
            <h3>Call Distribution by Team Division</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            {data?.chartData?.length ? (
              <Bar data={{
                labels: ["Teams"],
                datasets: [{ label: "Total Calls", data: [data.stats.calls], backgroundColor: chartThemeColors.primary, borderRadius: 8 }]
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No call data available yet
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Prospects Target vs Actual</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            {data?.chartData?.length ? (
              <Line data={{
                labels: data.chartData.map(c => c.date?.split('-').slice(1).join('/')),
                datasets: [
                  { label: "Total Calls", data: data.chartData.map(c => c.totalCalls), borderColor: chartThemeColors.success, backgroundColor: "rgba(16, 185, 129, 0.1)", fill: true, tension: 0.4 }
                ]
              }} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No prospect data available yet
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Weekly Deal & Revenue Logging Trends</h3>
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            {data?.chartData?.length ? (
              <Line data={{
                labels: data.chartData.map(c => c.date?.split('-').slice(1).join('/')),
                datasets: [
                  { label: "Deals Closed", data: data.chartData.map(c => c.totalDeals), borderColor: chartThemeColors.purple, tension: 0.2, pointRadius: 4, pointBackgroundColor: chartThemeColors.purple }
                ]
              }} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No deal data available yet
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Connection Call Outcome Share (%)</h3>
          </div>
          <div className="chart-container" style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
            {data?.stats?.calls > 0 ? (
              <Doughnut data={{
                labels: ["Connected", "Pending"],
                datasets: [{ data: [data.stats.connects, data.stats.calls - data.stats.connects], backgroundColor: [chartThemeColors.success, chartThemeColors.grid], borderWidth: 2 }]
              }} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No connection data available yet
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
