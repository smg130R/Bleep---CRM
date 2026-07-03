import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, PhoneCall, AlertTriangle, Clock } from 'lucide-react';

const Followups = ({ showToast }) => {
  const { user } = useAuth();
  const currentRole = user?.role;

  const [followups, setFollowups] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/followups');
      if (res.ok) {
        const data = await res.json();
        setFollowups(data.followups);
      }
    } catch (err) {
      console.error('Error fetching followups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [currentRole]);

  const handleResolveFollowup = async (id, name) => {
    const confirmDone = window.confirm(`Mark follow-up for customer ${name} as completed?`);
    if (!confirmDone) return;

    try {
      const res = await fetch(`/api/followups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved', remarks: 'Callback completed successfully.' })
      });
      if (res.ok) {
        showToast(`Follow-up checklist resolved for ${name}.`);
        fetchFollowups();
      }
    } catch (err) {
      showToast('Error completing follow-up', true);
    }
  };

  // Filter list based on UI select state
  const filteredList = followups.filter(f => {
    if (filterStatus === 'All') return true;
    
    const todayStr = new Date().toISOString().split('T')[0];
    if (filterStatus === 'Due Today') return f.date === todayStr;
    if (filterStatus === 'Overdue') return f.date < todayStr && f.status !== 'Resolved';
    if (filterStatus === 'Upcoming') return f.date > todayStr;
    return true;
  });

  const getPriorityBadgeClass = (priority) => {
    if (priority === 'High') return 'badge high';
    if (priority === 'Low') return 'badge low';
    return 'badge medium';
  };

  return (
    <div className="view-section active" id="follow-ups-view">
      <div className="table-controls-panel">
        <div className="filter-group">
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status Filter:</label>
          <div className="select-wrapper">
            <select 
              id="follow-ups-status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Schedules</option>
              <option value="Due Today">Due Today</option>
              <option value="Overdue">Overdue List</option>
              <option value="Upcoming">Upcoming Schedules</option>
            </select>
          </div>
        </div>
      </div>

      <div className="content-card" style={{ marginTop: '1.5rem', padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Schedule Date</th>
                <th>Assigned BDA</th>
                <th>Customer Name</th>
                <th>Contact Details</th>
                <th>College / Institute</th>
                <th>Priority Level</th>
                <th>Remarks / Issue Details</th>
                <th>Trigger Dial</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Loading follow-ups...</td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No pending callbacks scheduled under this view.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={`badge ${row.status === 'Resolved' ? 'excellent' : 'high'}`}>
                        {row.date}
                      </span>
                    </td>
                    <td>{row.bdaName || 'Me'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{row.customerName}</td>
                    <td>
                      <a href={`tel:${row.contact}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                        {row.contact}
                      </a>
                    </td>
                    <td>{row.college || '—'}</td>
                    <td>
                      <span className={getPriorityBadgeClass(row.priority)}>
                        {row.priority}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'normal', minWidth: '200px' }}>{row.remarks || '—'}</td>
                    <td>
                      <a 
                        href={`tel:${row.contact}`} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <PhoneCall size={12} />
                        Call
                      </a>
                    </td>
                    <td>
                      {row.status === 'Pending' ? (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: 'var(--success)', border: 'none' }}
                          onClick={() => handleResolveFollowup(row.id, row.customerName)}
                        >
                          Resolve
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Followups;
