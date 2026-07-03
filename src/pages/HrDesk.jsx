import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, CheckCircle, XCircle, AlertCircle, ShieldAlert, Send } from 'lucide-react';

const HrDesk = ({ showToast }) => {
  const { user } = useAuth();
  const currentRole = user?.role;

  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Form Fields
  const [leaveType, setLeaveType] = useState('Casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchHRData = async () => {
    try {
      setLoading(true);
      // Fetch Leaves
      const leavesRes = await fetch('/api/leaves');
      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        setLeaves(leavesData.leaves);
      }

      // Fetch Complaints if Admin or HR
      if (['admin', 'hr'].includes(currentRole)) {
        const complaintsRes = await fetch('/api/complaints');
        if (complaintsRes.ok) {
          const complaintsData = await complaintsRes.json();
          setComplaints(complaintsData.complaints);
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

  // Leave Actions
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

  // Complaint Actions
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

  return (
    <div className="view-section active" id="hr-desk-view">
      <div className="hr-desk-grid" style={{ display: 'grid', gridTemplateColumns: isHRorAdmin ? '1fr' : '1.2fr 1fr', gap: '2.0rem' }}>
        
        {/* Left/Main Column: Leaves Management */}
        <div>
          {/* Apply Leave (For normal employees like BDA) */}
          {!isHRorAdmin && (
            <div className="content-card" style={{ marginBottom: '2rem' }}>
              <div className="card-header" style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Request Time Off</h3>
              </div>
              <form onSubmit={handleApplyLeave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Leave Category</label>
                  <select 
                    className="table-select" 
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem' }}
                  >
                    <option value="Casual">Casual Leave</option>
                    <option value="Medical">Medical Leave</option>
                    <option value="Earned">Earned Leave</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Reason / Comments</label>
                  <input 
                    type="text" 
                    placeholder="Brief description..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>From Date</label>
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>To Date</label>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ gridColumn: 'span 2', padding: '0.75rem', marginTop: '0.5rem' }}
                >
                  Submit Application
                </button>
              </form>
            </div>
          )}

          {/* Leave Request Logs */}
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
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}
                                  onClick={() => handleReviewLeave(l.id, 'Approved')}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)' }}
                                  onClick={() => handleReviewLeave(l.id, 'Rejected')}
                                >
                                  Reject
                                </button>
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

        {/* Right/Secondary Column: Complaints Management Log (HR/Admin view only) */}
        {isHRorAdmin && (
          <div className="content-card" style={{ marginTop: '0' }} id="hr-complaints-card">
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
                <tbody id="hr-complaints-tbody">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No complaints filed.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{c.timestamp.split('T')[0]}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{c.bdaName}</td>
                        <td><span className="badge good">{c.recipientRole.toUpperCase()}</span></td>
                        <td style={{ fontWeight: 600 }}>{c.subject}</td>
                        <td style={{ whiteSpace: 'normal', minWidth: '180px', fontSize: '0.8rem' }}>{c.details}</td>
                        <td>
                          <span className={`badge ${c.status === 'Resolved' ? 'excellent' : 'pending'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          {c.status === 'Pending' ? (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', background: 'var(--success)', border: 'none' }}
                              onClick={() => handleResolveComplaint(c.id)}
                            >
                              Resolve
                            </button>
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
    </div>
  );
};

export default HrDesk;
