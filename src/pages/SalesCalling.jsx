import React, { useState, useEffect } from 'react';
import { PhoneCall, Download, Filter } from 'lucide-react';

const SalesCalling = ({ showToast }) => {
  const [callingData, setCallingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [pendingOnly, setPendingOnly] = useState(true);

  const fetchCallingSheet = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/calling');
      if (res.ok) {
        const data = await res.json();
        setCallingData(data.callingSheet);
      }
    } catch (err) {
      console.error('Error fetching BDA calling sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallingSheet();
  }, []);

  const handleStatusChange = async (index, newStatus) => {
    const record = callingData[index];
    const oldStatus = record.status;

    const updated = [...callingData];
    updated[index].status = newStatus;
    setCallingData(updated);

    try {
      const res = await fetch(`/api/calling/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, remarks: record.remarks })
      });

      if (res.ok) {
        showToast(`Logged "${newStatus}" for ${record.customerName}`);
      } else {
        showToast('Failed to update status on server.', true);
        updated[index].status = oldStatus;
        setCallingData(updated);
      }
    } catch {
      showToast('Server update failed.', true);
      updated[index].status = oldStatus;
      setCallingData(updated);
    }
  };

  const handleRemarksBlur = async (index, newRemarks) => {
    const record = callingData[index];
    try {
      await fetch(`/api/calling/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: record.status, remarks: newRemarks })
      });
    } catch {
      console.error('Failed to update remarks');
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
    "BUSY", "SWITCH OFF", "OUT OF SERVICE"
  ];

  const filtered = pendingOnly ? callingData.filter(r => r.status === 'Pending') : callingData;
  const pendingCount = callingData.filter(r => r.status === 'Pending').length;

  return (
    <div className="view-section active" id="sales-calling-view">
      <div className="auth-badge" style={{ margin: '0 0 1.5rem 0' }}>
        <PhoneCall size={14} />
        <span>Click customer numbers to initiate mobile/softphone dialing via tel: protocol.</span>
      </div>

      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {pendingCount} Pending / {callingData.length} Total
            </span>
            <button
              className={`btn ${pendingOnly ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPendingOnly(!pendingOnly)}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
            >
              <Filter size={12} /> {pendingOnly ? 'Pending Only' : 'All Leads'}
            </button>
          </div>
          <button className="btn btn-primary" onClick={fetchLeads} disabled={fetching}>
            <Download size={14} /> {fetching ? 'Fetching...' : 'Fetch 50 Leads'}
          </button>
        </div>
      </div>

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
                <th>Outbound Action</th>
                <th>Calling Status</th>
                <th>Last Update</th>
                <th>Conversation Remarks / Logs</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Loading calling records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {pendingOnly
                      ? 'No pending leads. Click "Fetch 50 Leads" to get new ones.'
                      : 'No customer leads assigned.'}
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{row.customerName}</td>
                    <td style={{ fontWeight: 500 }}>
                      <a href={`tel:${row.contact}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {row.contact}
                      </a>
                    </td>
                    <td>{row.college}</td>
                    <td>{row.branch}</td>
                    <td>{row.year}</td>
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
                      <select
                        className="table-select"
                        value={row.status}
                        onChange={(e) => handleStatusChange(idx, e.target.value)}
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
                        onBlur={(e) => handleRemarksBlur(idx, e.target.value)}
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
    </div>
  );
};

export default SalesCalling;
