import React, { useState, useEffect } from 'react';
import { Download, Filter, RefreshCw, Clock, AlertCircle, CheckCircle, PhoneOff } from 'lucide-react';

const MarketingCalling = ({ showToast }) => {
  const [callingData, setCallingData] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [tab, setTab] = useState('pending');

  const fetchCallingSheet = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/calling');
      if (res.ok) {
        const data = await res.json();
        setCallingData(data.callingSheet);
      }
    } catch (err) {
      console.error('Error fetching calling sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUps = async () => {
    try {
      setFollowUpLoading(true);
      const res = await fetch('/api/calling/follow-ups');
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps);
      }
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    } finally {
      setFollowUpLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'follow-ups') fetchFollowUps();
    else fetchCallingSheet();
  }, [tab]);

  const handleStatusChange = async (id, newStatus) => {
    const source = tab === 'follow-ups' ? followUps : callingData;
    const setter = tab === 'follow-ups' ? setFollowUps : setCallingData;
    const record = source.find(r => r.id === id);
    if (!record) return;
    const oldStatus = record.status;

    setter(source.map(r => r.id === id ? { ...r, status: newStatus } : r));

    try {
      const res = await fetch(`/api/calling/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, remarks: record.remarks })
      });

      if (res.ok) {
        showToast(`Logged "${newStatus}" for ${record.customerName}`);
        if (newStatus !== 'Follow-up' && newStatus !== 'No Answer') fetchFollowUps();
      } else {
        showToast('Failed to update status on server.', true);
        setter(source.map(r => r.id === id ? { ...r, status: oldStatus } : r));
      }
    } catch {
      showToast('Server update failed.', true);
      setter(source.map(r => r.id === id ? { ...r, status: oldStatus } : r));
    }
  };

  const handleRemarksBlur = async (id, newRemarks) => {
    const source = tab === 'follow-ups' ? followUps : callingData;
    const record = source.find(r => r.id === id);
    if (!record) return;
    try {
      await fetch(`/api/calling/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: record.status, remarks: newRemarks })
      });
    } catch {
      console.error('Failed to update remarks');
    }
  };

  const fixData = async () => {
    setFixing(true);
    try {
      const res = await fetch('/api/calling/fix-data', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        if (data.fixedCalling > 0 || data.fixedLeads > 0) fetchCallingSheet();
      } else {
        showToast(data.message || 'Failed to fix data.', true);
      }
    } catch {
      showToast('Connection error while fixing data.', true);
    } finally {
      setFixing(false);
    }
  };

  const fetchLeads = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/calling/fetch-leads', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        if (data.count > 0) fetchCallingSheet();
      } else {
        showToast(data.message || 'Failed to fetch leads.', true);
      }
    } catch {
      showToast('Connection error while fetching leads.', true);
    } finally {
      setFetching(false);
    }
  };

  const statusOptions = [
    "Pending", "NA", "NI", "FORM SHARED", "SCREENSHOT SHARED",
    "BUSY", "SWITCH OFF", "OUT OF SERVICE", "Follow-up"
  ];

  const followUpActions = ['Completed', 'No Answer', 'NA', 'NI', 'FORM SHARED', 'SCREENSHOT SHARED'];

  const filtered = tab === 'all' ? callingData : callingData.filter(r => r.status === 'Pending');
  const pendingCount = callingData.filter(r => r.status === 'Pending').length;
  const today = new Date().toISOString().split('T')[0];

  const renderTable = () => (
    <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Contact Details</th>
              <th>College / Institute</th>
              <th>Branch</th>
              <th>Academic Year</th>
              <th>Calling Status</th>
              <th>Last Update</th>
              <th>Conversation Remarks / Logs</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading calling records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                {tab === 'pending' ? 'No pending leads. Click "Fetch 50 Leads" to get new ones.' : 'No customer leads assigned.'}
              </td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{row.customerName}</td>
                  <td style={{ fontWeight: 500 }}>{row.contact}</td>
                  <td>{row.college}</td>
                  <td>{row.branch}</td>
                  <td>{row.year}</td>
                  <td>
                    <select
                      className="table-select"
                      value={row.status}
                      onChange={(e) => handleStatusChange(row.id, e.target.value)}
                      style={{ padding: '0.35rem 0.50rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.lastUpdated || 'Never'}</td>
                  <td>
                    <input
                      type="text"
                      className="table-input"
                      placeholder="Log customer response..."
                      defaultValue={row.remarks}
                      onBlur={(e) => handleRemarksBlur(row.id, e.target.value)}
                      style={{ width: '100%', minWidth: '220px' }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFollowUps = () => (
    <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Customer Name</th>
              <th>Contact</th>
              <th>College / Institute</th>
              <th>Branch</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Loading follow-ups...</td></tr>
            ) : followUps.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No follow-up records.
              </td></tr>
            ) : (
              followUps.map((row) => {
                const isMissed = row.followUpDate < today;
                const isToday = row.followUpDate === today;
                return (
                  <tr key={row.id} style={isMissed ? { background: '#fff0f0' } : isToday ? { background: '#fffbe6' } : {}}>
                    <td>
                      {isMissed ? (
                        <span style={{ color: '#d32f2f', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertCircle size={14} /> Missed
                        </span>
                      ) : isToday ? (
                        <span style={{ color: '#f57c00', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} /> Today
                        </span>
                      ) : (
                        <span style={{ color: '#388e3c' }}>Scheduled</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{row.customerName}</td>
                    <td>{row.contact}</td>
                    <td>{row.college}</td>
                    <td>{row.branch}</td>
                    <td style={{ fontWeight: 600, color: isMissed ? '#d32f2f' : 'inherit' }}>{row.followUpDate}</td>
                    <td>{row.status}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={() => handleStatusChange(row.id, 'Completed')}
                          title="Mark as completed"
                        >
                          <CheckCircle size={12} /> Done
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={() => handleStatusChange(row.id, 'No Answer')}
                          title="No answer - push to tomorrow"
                        >
                          <PhoneOff size={12} /> No Ans
                        </button>
                        <select
                          className="table-select"
                          value=""
                          onChange={(e) => { if (e.target.value) handleStatusChange(row.id, e.target.value); }}
                          style={{ padding: '0.25rem 0.3rem', fontSize: '0.7rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                        >
                          <option value="">More...</option>
                          {followUpActions.filter(a => a !== 'Completed' && a !== 'No Answer').map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="table-input"
                        placeholder="Log response..."
                        defaultValue={row.remarks}
                        onBlur={(e) => handleRemarksBlur(row.id, e.target.value)}
                        style={{ width: '100%', minWidth: '140px' }}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="view-section active" id="marketing-calling-view">
      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {tab === 'follow-ups' ? `${followUps.length} Follow-ups` : `${pendingCount} Pending / ${callingData.length} Total`}
            </span>
            <button
              className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('pending')}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
            >
              <Filter size={12} /> Pending Only
            </button>
            <button
              className={`btn ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('all')}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
            >
              <Filter size={12} /> All Leads
            </button>
            <button
              className={`btn ${tab === 'follow-ups' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('follow-ups')}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
            >
              <Clock size={12} /> Follow-ups {followUps.filter(f => f.followUpDate < today).length > 0 && (
                <span style={{ background: '#d32f2f', color: '#fff', borderRadius: '50%', padding: '0.1rem 0.35rem', fontSize: '0.65rem', marginLeft: '0.2rem' }}>
                  {followUps.filter(f => f.followUpDate < today).length}
                </span>
              )}
            </button>
            <button className="btn btn-secondary" onClick={fixData} disabled={fixing} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
              <RefreshCw size={12} className={fixing ? 'animate-spin' : ''} /> {fixing ? 'Fixing...' : 'Fix Data'}
            </button>
          </div>
          {tab !== 'follow-ups' && (
            <button className="btn btn-primary" onClick={fetchLeads} disabled={fetching}>
              <Download size={14} /> {fetching ? 'Fetching...' : 'Fetch 50 Leads'}
            </button>
          )}
        </div>
      </div>

      {tab === 'follow-ups' ? renderFollowUps() : renderTable()}
    </div>
  );
};

export default MarketingCalling;
