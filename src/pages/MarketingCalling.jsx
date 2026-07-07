import React, { useState, useEffect } from 'react';
import { Download, Filter, RefreshCw, Clock, AlertCircle, CheckCircle, PhoneOff, Phone, XCircle, Ban, Mail, Image, Loader } from 'lucide-react';

const statusColors = {
  Pending: '#6b7280',
  Connected: '#10b981',
  Interested: '#3b82f6',
  NA: '#ef4444',
  NI: '#f59e0b',
  'FORM SHARED': '#8b5cf6',
  'SCREENSHOT SHARED': '#06b6d4',
  BUSY: '#f97316',
  'SWITCH OFF': '#6b7280',
  'OUT OF SERVICE': '#6b7280',
  'Follow-up': '#eab308',
  'Deal Closed': '#059669',
  Completed: '#10b981',
  'No Answer': '#94a3b8',
};

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
          <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
            <tr>
              <th style={{ background: 'var(--bg-card)' }}>Customer Name</th>
              <th style={{ background: 'var(--bg-card)' }}>Contact Details</th>
              <th style={{ background: 'var(--bg-card)' }}>College / Institute</th>
              <th style={{ background: 'var(--bg-card)' }}>Branch</th>
              <th style={{ background: 'var(--bg-card)' }}>Academic Year</th>
              <th style={{ background: 'var(--bg-card)' }}>Calling Status</th>
              <th style={{ background: 'var(--bg-card)' }}>Last Update</th>
              <th style={{ background: 'var(--bg-card)' }}>Conversation Remarks / Logs</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader size={24} className="animate-spin" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <div style={{ color: 'var(--text-muted)' }}>Loading calling records...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Phone size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <div>
                  {tab === 'pending'
                    ? 'All caught up! No pending leads. Click "Fetch 50 Leads" to get new ones.'
                    : 'No customer leads assigned to you yet.'}
                </div>
              </td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-navy)', whiteSpace: 'nowrap' }}>{row.customerName}</td>
                  <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{row.contact}</td>
                  <td style={{ fontSize: '0.85rem' }}>{row.college}</td>
                  <td style={{ fontSize: '0.85rem' }}>{row.branch}</td>
                  <td style={{ fontSize: '0.85rem' }}>{row.year}</td>
                  <td>
                    <select
                      className="table-select"
                      value={row.status}
                      onChange={(e) => handleStatusChange(row.id, e.target.value)}
                      style={{
                        padding: '0.35rem 0.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: statusColors[row.status] || '#6b7280',
                        cursor: 'pointer',
                      }}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt} style={{ color: '#000', background: '#fff' }}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.lastUpdated || 'Never'}</td>
                  <td style={{ minWidth: '200px' }}>
                    <input
                      type="text"
                      className="table-input"
                      placeholder="Log customer response..."
                      defaultValue={row.remarks}
                      onBlur={(e) => handleRemarksBlur(row.id, e.target.value)}
                      style={{ width: '100%' }}
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
          <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
            <tr>
              <th style={{ background: 'var(--bg-card)' }}>Priority</th>
              <th style={{ background: 'var(--bg-card)' }}>Customer Name</th>
              <th style={{ background: 'var(--bg-card)' }}>Contact</th>
              <th style={{ background: 'var(--bg-card)' }}>College / Institute</th>
              <th style={{ background: 'var(--bg-card)' }}>Branch</th>
              <th style={{ background: 'var(--bg-card)' }}>Due Date</th>
              <th style={{ background: 'var(--bg-card)' }}>Status</th>
              <th style={{ background: 'var(--bg-card)' }}>Action</th>
              <th style={{ background: 'var(--bg-card)' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {followUpLoading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader size={24} className="animate-spin" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <div style={{ color: 'var(--text-muted)' }}>Loading follow-ups...</div>
              </td></tr>
            ) : followUps.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Clock size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <div>No follow-up records. Mark a lead as "Follow-up" to see it here.</div>
              </td></tr>
            ) : (
              followUps.map((row) => {
                const isMissed = row.followUpDate < today;
                const isToday = row.followUpDate === today;
                return (
                  <tr key={row.id} style={{
                    background: isMissed ? '#fef2f2' : isToday ? '#fffbeb' : 'transparent',
                    borderLeft: isMissed ? '3px solid #ef4444' : isToday ? '3px solid #f59e0b' : '3px solid transparent',
                  }}>
                    <td>
                      {isMissed ? (
                        <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
                          <AlertCircle size={14} /> Missed
                        </span>
                      ) : isToday ? (
                        <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
                          <Clock size={14} /> Today
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontSize: '0.85rem' }}>Scheduled</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.customerName}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{row.contact}</td>
                    <td style={{ fontSize: '0.85rem' }}>{row.college}</td>
                    <td style={{ fontSize: '0.85rem' }}>{row.branch}</td>
                    <td style={{
                      fontWeight: 700,
                      color: isMissed ? '#dc2626' : isToday ? '#d97706' : '#374151',
                      whiteSpace: 'nowrap',
                    }}>
                      {row.followUpDate}
                    </td>
                    <td>
                      <select
                        className="table-select"
                        value={row.status}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        style={{
                          padding: '0.3rem 0.5rem',
                          fontSize: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontWeight: 600,
                          backgroundColor: statusColors[row.status] || '#6b7280',
                        }}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt} value={opt} style={{ color: '#000', background: '#fff' }}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', background: '#10b981', borderColor: '#10b981' }}
                          onClick={() => handleStatusChange(row.id, 'Completed')}
                          title="Mark as completed"
                        >
                          <CheckCircle size={12} /> Done
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
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
                    <td style={{ minWidth: '140px' }}>
                      <input
                        type="text"
                        className="table-input"
                        placeholder="Log response..."
                        defaultValue={row.remarks}
                        onBlur={(e) => handleRemarksBlur(row.id, e.target.value)}
                        style={{ width: '100%' }}
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('pending')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', position: 'relative' }}
            >
              Pending
              <span style={{
                background: tab === 'pending' ? 'rgba(255,255,255,0.25)' : 'var(--border-color)',
                borderRadius: '999px',
                padding: '0.1rem 0.45rem',
                fontSize: '0.65rem',
                marginLeft: '0.35rem',
                fontWeight: 700,
              }}>
                {pendingCount}
              </span>
            </button>
            <button
              className={`btn ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('all')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              All
              <span style={{
                background: tab === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--border-color)',
                borderRadius: '999px',
                padding: '0.1rem 0.45rem',
                fontSize: '0.65rem',
                marginLeft: '0.35rem',
                fontWeight: 700,
              }}>
                {callingData.length}
              </span>
            </button>
            <button
              className={`btn ${tab === 'follow-ups' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('follow-ups')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              <Clock size={12} style={{ marginRight: '0.25rem' }} /> Follow-ups
              {followUps.filter(f => f.followUpDate < today).length > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '999px',
                  padding: '0.1rem 0.4rem',
                  fontSize: '0.6rem',
                  marginLeft: '0.35rem',
                  fontWeight: 700,
                }}>
                  {followUps.filter(f => f.followUpDate < today).length}
                </span>
              )}
            </button>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.25rem' }} />
            <button className="btn btn-secondary" onClick={fixData} disabled={fixing} style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>
              <RefreshCw size={12} className={fixing ? 'animate-spin' : ''} /> {fixing ? 'Fixing...' : 'Fix'}
            </button>
          </div>
          {tab !== 'follow-ups' && (
            <button className="btn btn-primary" onClick={fetchLeads} disabled={fetching} style={{ fontSize: '0.85rem' }}>
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
