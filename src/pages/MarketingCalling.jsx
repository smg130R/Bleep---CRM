import React, { useState, useEffect } from 'react';
import { Download, Filter, RefreshCw, Clock, AlertCircle, CheckCircle, PhoneOff, Phone, XCircle, Ban, Mail, Image, Loader } from 'lucide-react';

const statusColors = {
  '': '#f1f5f9',
  NA: '#ef4444',
  NI: '#f59e0b',
  'FORM SHARED': '#8b5cf6',
  'SCREENSHOT SHARED': '#06b6d4',
  BUSY: '#f97316',
  'SWITCH OFF': '#6b7280',
  'NOT YET REPLIED': '#d97706',
  'CALL BACK': '#eab308',
  'OUT OF SERVICE': '#6b7280',
  'WRONG NUMBER': '#dc2626',
  RESPONDED: '#10b981',
  Completed: '#10b981',
  'No Answer': '#94a3b8',
};

const statusOptions = [
  "", "NA", "NI", "FORM SHARED", "SCREENSHOT SHARED",
  "BUSY", "SWITCH OFF", "NOT YET REPLIED", "CALL BACK",
  "OUT OF SERVICE", "WRONG NUMBER", "RESPONDED"
];

const followUpActions = ['Completed', 'No Answer', 'NA', 'NI', 'FORM SHARED', 'SCREENSHOT SHARED', 'NOT YET REPLIED', 'CALL BACK', 'WRONG NUMBER', 'RESPONDED'];

const callingColumns = [
  { key: 'name', label: 'Customer Name' },
  { key: 'contact', label: 'Contact Details' },
  { key: 'college', label: 'College / Institute' },
  { key: 'branch', label: 'Branch' },
  { key: 'year', label: 'Academic Year' },
  { key: 'status', label: 'Calling Status' },
  { key: 'lastUpdate', label: 'Last Update' },
  { key: 'remarks', label: 'Conversation Remarks / Logs' },
];

const followUpColumns = [
  { key: 'priority', label: 'Priority' },
  { key: 'name', label: 'Customer Name' },
  { key: 'contact', label: 'Contact' },
  { key: 'college', label: 'College / Institute' },
  { key: 'branch', label: 'Branch' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action' },
  { key: 'remarks', label: 'Remarks' },
];

const MarketingCalling = ({ showToast }) => {
  const [callingData, setCallingData] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [tab, setTab] = useState('pending');
  const [columnOrder, setColumnOrder] = useState(callingColumns.map(c => c.key));
  const [fuColumnOrder, setFuColumnOrder] = useState(followUpColumns.map(c => c.key));
  const [colWidths, setColWidths] = useState({});
  const [resizing, setResizing] = useState(null);
  const [dragCol, setDragCol] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

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
    if (!newStatus) return;
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

  const filtered = tab === 'all' ? callingData : callingData.filter(r => !r.status || r.status === 'Pending');
  const pendingCount = callingData.filter(r => !r.status || r.status === 'Pending').length;
  const today = new Date().toISOString().split('T')[0];

  // Column resize
  const handleResizeStart = (key, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(key);
  };

  useEffect(() => {
    if (!resizing) return;
    const handleMouseMove = (e) => {
      const th = document.querySelector(`th[data-col="${resizing}"]`);
      if (!th) return;
      const newWidth = Math.max(60, e.clientX - th.getBoundingClientRect().left);
      setColWidths(prev => ({ ...prev, [resizing]: newWidth }));
    };
    const handleMouseUp = () => setResizing(null);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  // Column reorder
  const handleDragStart = (key, e) => {
    setDragCol(key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (key, e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(key);
  };

  const handleDrop = (key, isFollowUp) => {
    const [order, setOrder] = isFollowUp ? [fuColumnOrder, setFuColumnOrder] : [columnOrder, setColumnOrder];
    if (!dragCol || dragCol === key) { setDropTarget(null); return; }
    setOrder(prev => {
      const arr = [...prev];
      const fromIdx = arr.indexOf(dragCol);
      const toIdx = arr.indexOf(key);
      if (fromIdx === -1 || toIdx === -1) return prev;
      arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, dragCol);
      return arr;
    });
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragCol(null);
    setDropTarget(null);
  };

  const renderHeader = (col, order, isFollowUp) => {
    const colDef = (isFollowUp ? followUpColumns : callingColumns).find(c => c.key === col);
    if (!colDef) return null;
    const width = colWidths[colDef.key];
    const isDragging = dragCol === colDef.key;
    const isDrop = dropTarget === colDef.key;
    return (
      <th
        key={colDef.key}
        data-col={colDef.key}
        draggable
        onDragStart={(e) => handleDragStart(colDef.key, e)}
        onDragOver={(e) => handleDragOver(colDef.key, e)}
        onDrop={() => handleDrop(colDef.key, isFollowUp)}
        onDragEnd={handleDragEnd}
        style={{
          position: 'relative',
          width: width || undefined,
          minWidth: width || 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          background: 'var(--bg-card)',
          ...(isDragging ? { opacity: 0.4 } : {}),
          ...(isDrop ? { borderLeft: '2px solid var(--primary)', background: 'var(--primary-light)' } : {}),
        }}
      >
        {colDef.label}
        <div
          className={`col-resize-handle${resizing === colDef.key ? ' resizing' : ''}`}
          onMouseDown={(e) => handleResizeStart(colDef.key, e)}
        />
      </th>
    );
  };

  const renderCallingCell = (col, row) => {
    const width = colWidths[col];
    const style = { width: width || undefined, minWidth: width || 80, overflow: 'hidden', textOverflow: 'ellipsis' };
    switch (col) {
      case 'name':
        return <td key={col} style={{ ...style, fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{row.customerName}</td>;
      case 'contact':
        return (
          <td
            key={col}
            style={{ ...style, fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer' }}
            onClick={() => navigator.clipboard.writeText(row.contact)}
            title="Click to copy"
          >
            <div>{row.contact}</div>
            {row.whatsapp && row.whatsapp !== row.contact && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                WA: {row.whatsapp}
              </div>
            )}
          </td>
        );
      case 'college':
        return <td key={col} style={{ ...style, fontSize: '0.85rem' }}>{row.college}</td>;
      case 'branch':
        return <td key={col} style={{ ...style, fontSize: '0.85rem' }}>{row.branch}</td>;
      case 'year':
        return <td key={col} style={{ ...style, fontSize: '0.85rem' }}>{row.year}</td>;
      case 'status':
        return (
          <td key={col} style={style}>
<select
                className="table-select"
                value={row.status === 'Pending' ? '' : row.status}
                onChange={(e) => handleStatusChange(row.id, e.target.value)}
                style={{
                  padding: '0.35rem 0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  color: row.status && row.status !== 'Pending' ? '#fff' : 'var(--text-primary)',
                  backgroundColor: statusColors[row.status] || (row.status === 'Pending' ? '#f1f5f9' : '#6b7280'),
                  cursor: 'pointer',
                }}
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt} style={{ color: '#000', background: '#fff' }}>{opt || '— Select —'}</option>
                ))}
              </select>
          </td>
        );
      case 'lastUpdate':
        return <td key={col} style={{ ...style, fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{row.lastUpdated || 'Never'}</td>;
      case 'remarks':
        return (
          <td key={col} style={{ ...style, minWidth: Math.max(width || 200, 200) }}>
            <input
              type="text"
              className="table-input"
              placeholder="Log customer response..."
              defaultValue={row.remarks}
              onBlur={(e) => handleRemarksBlur(row.id, e.target.value)}
              style={{ width: '100%' }}
            />
          </td>
        );
      default:
        return <td key={col} style={style} />;
    }
  };

  const renderFollowUpCell = (col, row) => {
    const width = colWidths[col];
    const style = { width: width || undefined, minWidth: width || 80, overflow: 'hidden', textOverflow: 'ellipsis' };
    const isMissed = row.followUpDate < today;
    const isToday = row.followUpDate === today;
    switch (col) {
      case 'priority':
        return (
          <td key={col} style={style}>
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
        );
      case 'name':
        return <td key={col} style={{ ...style, fontWeight: 600, whiteSpace: 'nowrap' }}>{row.customerName}</td>;
      case 'contact':
        return (
          <td
            key={col}
            style={{ ...style, whiteSpace: 'nowrap', cursor: 'pointer' }}
            onClick={() => navigator.clipboard.writeText(row.contact)}
            title="Click to copy"
          >
            <div>{row.contact}</div>
            {row.whatsapp && row.whatsapp !== row.contact && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                WA: {row.whatsapp}
              </div>
            )}
          </td>
        );
      case 'college':
        return <td key={col} style={{ ...style, fontSize: '0.85rem' }}>{row.college}</td>;
      case 'branch':
        return <td key={col} style={{ ...style, fontSize: '0.85rem' }}>{row.branch}</td>;
      case 'dueDate':
        return (
          <td key={col} style={{
            ...style,
            fontWeight: 700,
            color: isMissed ? '#dc2626' : isToday ? '#d97706' : '#374151',
            whiteSpace: 'nowrap',
          }}>
            {row.followUpDate}
          </td>
        );
      case 'status':
        return (
          <td key={col} style={style}>
            <select
              className="table-select"
              value={row.status === 'Pending' ? '' : row.status}
              onChange={(e) => handleStatusChange(row.id, e.target.value)}
              style={{
                padding: '0.3rem 0.5rem',
                fontSize: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: row.status && row.status !== 'Pending' ? '#fff' : 'var(--text-primary)',
                fontWeight: 600,
                backgroundColor: statusColors[row.status] || (row.status === 'Pending' ? '#f1f5f9' : '#6b7280'),
              }}
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt} style={{ color: '#000', background: '#fff' }}>{opt || '— Select —'}</option>
              ))}
            </select>
          </td>
        );
      case 'action':
        return (
          <td key={col} style={style}>
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
                style={{ padding: '0.25rem 0.3rem', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="">More...</option>
                {followUpActions.filter(a => a !== 'Completed' && a !== 'No Answer').map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </td>
        );
      case 'remarks':
        return (
          <td key={col} style={{ ...style, minWidth: Math.max(width || 140, 140) }}>
            <input
              type="text"
              className="table-input"
              placeholder="Log response..."
              defaultValue={row.remarks}
              onBlur={(e) => handleRemarksBlur(row.id, e.target.value)}
              style={{ width: '100%' }}
            />
          </td>
        );
      default:
        return <td key={col} style={style} />;
    }
  };

  const renderTable = () => (
    <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="table-responsive">
        <table className="data-table data-table-bordered" style={{ tableLayout: 'fixed' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
            <tr>{columnOrder.map(col => renderHeader(col, columnOrder, false))}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columnOrder.length} style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader size={24} className="animate-spin" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <div style={{ color: 'var(--text-secondary)' }}>Loading calling records...</div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={columnOrder.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <Phone size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <div>
                  {tab === 'pending'
                    ? 'All caught up! No pending leads. Click "Fetch 50 Leads" to get new ones.'
                    : 'No customer leads assigned to you yet.'}
                </div>
              </td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>{columnOrder.map(col => renderCallingCell(col, row))}</tr>
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
        <table className="data-table data-table-bordered" style={{ tableLayout: 'fixed' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
            <tr>{fuColumnOrder.map(col => renderHeader(col, fuColumnOrder, true))}</tr>
          </thead>
          <tbody>
            {followUpLoading ? (
              <tr><td colSpan={fuColumnOrder.length} style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader size={24} className="animate-spin" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <div style={{ color: 'var(--text-secondary)' }}>Loading follow-ups...</div>
              </td></tr>
            ) : followUps.length === 0 ? (
              <tr><td colSpan={fuColumnOrder.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
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
                    {fuColumnOrder.map(col => renderFollowUpCell(col, row))}
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
                background: tab === 'pending' ? 'rgba(255,255,255,0.25)' : 'var(--border)',
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
                background: tab === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--border)',
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
            <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.25rem' }} />
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