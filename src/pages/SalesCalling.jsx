import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PhoneCall, Edit3, MessageCircle, AlertCircle, Save } from 'lucide-react';

const SalesCalling = ({ showToast }) => {
  const [callingData, setCallingData] = useState([]);
  const [loading, setLoading] = useState(true);

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
    
    // Optimistic UI update
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
        showToast(`Logged status "${newStatus}" for customer ${record.customerName}`);
      } else {
        showToast('Failed to update status on server.', true);
        // Rollback
        updated[index].status = oldStatus;
        setCallingData(updated);
      }
    } catch (err) {
      showToast('Server update failed.', true);
      // Rollback
      updated[index].status = oldStatus;
      setCallingData(updated);
    }
  };

  const handleRemarksBlur = async (index, newRemarks) => {
    const record = callingData[index];
    
    try {
      const res = await fetch(`/api/calling/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: record.status, remarks: newRemarks })
      });
      
      if (res.ok) {
        showToast(`Remarks updated for ${record.customerName}`);
      }
    } catch (err) {
      console.error('Failed to update remarks:', err);
    }
  };

  const statusOptions = [
    "Pending", "NA", "NI", "FORM SHARED", "SCREENSHOT SHARED", 
    "BUSY", "SWITCH OFF", "OUT OF SERVICE"
  ];

  return (
    <div className="view-section active" id="sales-calling-view">
      <div className="auth-badge" style={{ margin: '0 0 1.5rem 0' }}>
        <PhoneCall size={14} />
        <span>Click customer numbers to initiate mobile/softphone dialing via tel: protocol.</span>
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
              ) : callingData.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No customer leads assigned.
                  </td>
                </tr>
              ) : (
                callingData.map((row, idx) => (
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
