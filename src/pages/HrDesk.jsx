import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, CheckCircle, XCircle, AlertCircle, ShieldAlert, Send, BarChart3, TrendingUp, Users, Phone, Target } from 'lucide-react';

const HrDesk = ({ showToast }) => {
  const { user } = useAuth();
  const currentRole = user?.role;

  const [activeTab, setActiveTab] = useState('leaves');
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // KPI Reports
  const [reportRange, setReportRange] = useState('weekly');
  const [reportData, setReportData] = useState({ weekly: [], monthly: [], funnel: { weekly: {}, monthly: {} }, weekRange: '', monthRange: '' });

  // Leave Form Fields
  const [leaveType, setLeaveType] = useState('Casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchHRData = async () => {
    try {
      setLoading(true);
      const leavesRes = await fetch('/api/leaves');
      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        setLeaves(leavesData.leaves);
      }

      if (['admin', 'hr'].includes(currentRole)) {
        const complaintsRes = await fetch('/api/complaints');
        if (complaintsRes.ok) {
          const complaintsData = await complaintsRes.json();
          setComplaints(complaintsData.complaints);
        }
      }

      // KPI report
      if (['admin', 'hr', 'ops_head'].includes(currentRole)) {
        const reportRes = await fetch('/api/kpi/hr-report');
        if (reportRes.ok) {
          setReportData(await reportRes.json());
        }
      }
    } catch (err) {
      console.error('Error fetching HR desk metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, [currentRole]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason) {
      showToast('Please fill all fields to request leave.', true);
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      showToast('End date cannot be before start date.', true);
      return;
    }
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveType, fromDate, toDate, reason })
      });
      if (res.ok) {
        showToast('Leave request submitted successfully.');
        setFromDate('');
        setToDate('');
        setReason('');
        fetchHRData();
      }
    } catch (err) {
      showToast('Leave submission failed.', true);
    }
  };

  const handleReviewLeave = async (id, status) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Leave request ${status.toLowerCase()} successfully.`);
        fetchHRData();
      }
    } catch (err) {
      showToast('Action failed.', true);
    }
  };

  const handleResolveComplaint = async (id) => {
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' })
      });
      if (res.ok) {
        showToast('Complaint resolved.');
        fetchHRData();
      }
    } catch (err) {
      showToast('Failed to resolve complaint.', true);
    }
  };

  const isHRorAdmin = ['admin', 'hr'].includes(currentRole);
  const canViewReports = ['admin', 'hr', 'ops_head'].includes(currentRole);

  const tabStyle = (tab) => ({
    padding: '0.5rem 1rem',
    fontWeight: 600,
    fontSize: '0.85rem',
    border: 'none',
    background: activeTab === tab ? 'var(--primary-navy)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-muted)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
  });

  const records = reportRange === 'weekly' ? reportData.weekly : reportData.monthly;
  const currentFunnel = reportRange === 'weekly' ? reportData.funnel?.weekly : reportData.funnel?.monthly;

  return (
    <div className="view-section active" id="hr-desk-view">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button style={tabStyle('leaves')} onClick={() => setActiveTab('leaves')}>
          <FileText size={14} style={{ marginRight: '0.3rem' }} /> Leaves
        </button>
        {canViewReports && (
          <button style={tabStyle('reports')} onClick={() => setActiveTab('reports')}>
            <BarChart3 size={14} style={{ marginRight: '0.3rem' }} /> KPI Reports
          </button>
        )}
        {isHRorAdmin && (
          <button style={tabStyle('complaints')} onClick={() => setActiveTab('complaints')}>
            <AlertCircle size={14} style={{ marginRight: '0.3rem' }} /> Complaints
          </button>
        )}
      </div>

      {activeTab === 'leaves' && (
        <div className="hr-desk-grid" style={{ display: 'grid', gridTemplateColumns: isHRorAdmin ? '1fr' : '1.2fr 1fr', gap: '2.0rem' }}>
          <div>
            {!isHRorAdmin && (
              <div className="content-card" style={{ marginBottom: '2rem' }}>
                <div className="card-header" style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Request Time Off</h3>
                </div>
                <form onSubmit={handleApplyLeave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Leave Category</label>
                    <select className="table-select" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={{ width: '100%', padding: '0.75rem' }}>
                      <option value="Casual">Casual Leave</option>
                      <option value="Medical">Medical Leave</option>
                      <option value="Earned">Earned Leave</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Reason / Comments</label>
                    <input type="text" placeholder="Brief description..." value={reason} onChange={(e) => setReason(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>From Date</label>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>To Date</label>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', padding: '0.75rem', marginTop: '0.5rem' }}>
                    Submit Application
                  </button>
                </form>
              </div>
            )}
            <div className="content-card">
              <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {isHRorAdmin ? 'Leave Applications Register' : 'My Leave Request History'}
                </h3>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Emp ID</th>
                      <th>Name</th>
                      <th>Leave Category</th>
                      <th>Dates Range</th>
                      <th>Reason</th>
                      <th>Status</th>
                      {isHRorAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan={isHRorAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No leave records found.
                        </td>
                      </tr>
                    ) : (
                      leaves.map((l) => (
                        <tr key={l.id}>
                          <td>{l.employeeCode || ('EMP-' + String(l.employeeId).padStart(3, '0'))}</td>
                          <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{l.employeeName || user.name}</td>
                          <td>{l.leaveType}</td>
                          <td style={{ fontSize: '0.825rem' }}>{l.fromDate} to {l.toDate}</td>
                          <td>{l.reason}</td>
                          <td>
                            <span className={`badge ${l.status === 'Approved' ? 'excellent' : l.status === 'Rejected' ? 'high' : 'pending'}`}>
                              {l.status}
                            </span>
                          </td>
                          {isHRorAdmin && (
                            <td>
                              {l.status === 'Pending' ? (
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}
                                    onClick={() => handleReviewLeave(l.id, 'Approved')}>Approve</button>
                                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                                    onClick={() => handleReviewLeave(l.id, 'Rejected')}>Reject</button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Reviewed</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && canViewReports && (
        <div>
          {/* Range toggle */}
          <div className="content-card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Report Period:</span>
              <button className={`btn ${reportRange === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setReportRange('weekly')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                Weekly ({reportData.weekRange})
              </button>
              <button className={`btn ${reportRange === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setReportRange('monthly')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                Monthly ({reportData.monthRange})
              </button>
            </div>
          </div>

          {/* Funnel KPIs */}
          {currentFunnel && (
            <div className="dashboard-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="kpi-card blue">
                <div className="kpi-card-header"><span className="kpi-card-title">Total Calls</span><Phone size={18} /></div>
                <div className="kpi-card-value">{currentFunnel.calls}</div>
              </div>
              <div className="kpi-card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="kpi-card-header"><span className="kpi-card-title">Connect Rate</span><TrendingUp size={18} /></div>
                <div className="kpi-card-value">{currentFunnel.connectRate}%</div>
                <div className="kpi-card-footer">{currentFunnel.connects} connects</div>
              </div>
              <div className="kpi-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                <div className="kpi-card-header"><span className="kpi-card-title">Prospect Rate</span><Target size={18} /></div>
                <div className="kpi-card-value">{currentFunnel.prospectRate}%</div>
                <div className="kpi-card-footer">{currentFunnel.prospects} prospects</div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-card-header"><span className="kpi-card-title">Deal Rate</span><BarChart3 size={18} /></div>
                <div className="kpi-card-value">{currentFunnel.dealRate}%</div>
                <div className="kpi-card-footer">{currentFunnel.deals} deals</div>
              </div>
            </div>
          )}

          {/* BDA Table */}
          <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>BDA Name</th>
                    <th>Team</th>
                    <th>Calls</th>
                    <th>Connects</th>
                    <th>Connect %</th>
                    <th>Screenshots</th>
                    <th>Prospects</th>
                    <th>Deals</th>
                    <th>Avg Perf Score</th>
                    <th>Days Active</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No data for this period.</td></tr>
                  ) : (
                    records.map((r, i) => (
                      <tr key={r.bdaId || i}>
                        <td style={{ fontWeight: 600 }}>{r.bdaName}</td>
                        <td>{r.teamId || '-'}</td>
                        <td>{r.calls}</td>
                        <td>{r.connects}</td>
                        <td><span style={{ color: r.connectionRate >= 40 ? 'var(--success)' : r.connectionRate >= 20 ? 'var(--warning)' : 'var(--danger)', fontWeight: 600 }}>{r.connectionRate}%</span></td>
                        <td>{r.screenshots}</td>
                        <td>{r.prospects}</td>
                        <td style={{ fontWeight: 600, color: r.deals > 0 ? 'var(--success)' : 'inherit' }}>{r.deals}</td>
                        <td><span className={`badge ${r.avgPerfScore >= 70 ? 'excellent' : r.avgPerfScore >= 40 ? 'average' : 'pending'}`}>{r.avgPerfScore}</span></td>
                        <td>{r.daysActive}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'complaints' && isHRorAdmin && (
        <div className="content-card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Internal Staff Complaints Register</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Filer</th>
                  <th>Directed To</th>
                  <th>Subject</th>
                  <th>Issue Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No complaints filed.</td></tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{c.timestamp.split('T')[0]}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{c.bdaName}</td>
                      <td><span className="badge good">{c.recipientRole.toUpperCase()}</span></td>
                      <td style={{ fontWeight: 600 }}>{c.subject}</td>
                      <td style={{ whiteSpace: 'normal', minWidth: '180px', fontSize: '0.8rem' }}>{c.details}</td>
                      <td><span className={`badge ${c.status === 'Resolved' ? 'excellent' : 'pending'}`}>{c.status}</span></td>
                      <td>
                        {c.status === 'Pending' ? (
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', background: 'var(--success)', border: 'none' }}
                            onClick={() => handleResolveComplaint(c.id)}>Resolve</button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Resolved</span>
                        )}
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

export default HrDesk;
