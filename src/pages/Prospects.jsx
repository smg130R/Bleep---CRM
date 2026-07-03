import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Save, ExternalLink } from 'lucide-react';

const Prospects = ({ showToast }) => {
  const { user } = useAuth();
  const [prospects, setProspects] = useState([]);
  const [filteredProspects, setFilteredProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sheetUrls, setSheetUrls] = useState({ assignedSheetUrl: '', prospectSheetUrl: '' });

  const [form, setForm] = useState({
    customerName: '', contact: '', college: '', branch: '', year: '', status: 'Prospect', remarks: ''
  });

  useEffect(() => {
    Promise.all([fetchProspects(), fetchSheetUrls()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') setFilteredProspects(prospects);
    else setFilteredProspects(prospects.filter(p => p.status === statusFilter));
  }, [statusFilter, prospects]);

  const fetchProspects = async () => {
    try {
      const res = await fetch('/api/prospects');
      if (res.ok) {
        const data = await res.json();
        setProspects(data.prospects || []);
      }
    } catch (err) {
      console.error('Fetch prospects error:', err);
    }
  };

  const fetchSheetUrls = async () => {
    try {
      const res = await fetch('/api/prospects/bda-sheets');
      if (res.ok) {
        const data = await res.json();
        setSheetUrls({
          assignedSheetUrl: data.user?.assignedSheetUrl || '',
          prospectSheetUrl: data.user?.prospectSheetUrl || '',
        });
      }
    } catch (err) {
      console.error('Fetch sheet URLs error:', err);
    }
  };

  const handleAddProspect = async () => {
    if (!form.customerName || !form.contact) {
      showToast('Customer name and contact are required.', true);
      return;
    }
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast('Prospect added.');
        setShowForm(false);
        setForm({ customerName: '', contact: '', college: '', branch: '', year: '', status: 'Prospect', remarks: '' });
        fetchProspects();
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to add.', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const old = [...prospects];
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    try {
      const res = await fetch(`/api/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) setProspects(old);
    } catch (err) {
      setProspects(old);
    }
  };

  const statusOptions = ['Prospect', 'Registration Done', 'Follow-up Needed', 'Converted', 'Lost'];

  const statusColor = (s) => {
    const c = {
      Prospect: 'var(--accent-blue)',
      'Registration Done': 'var(--success)',
      'Follow-up Needed': 'var(--warning)',
      Converted: 'var(--purple)',
      Lost: 'var(--danger)',
    };
    return c[s] || 'var(--text-muted)';
  };

  const openSheet = (url) => {
    if (url) window.open(url, '_blank', 'noopener');
    else showToast('No sheet URL configured.', true);
  };

  if (loading) {
    return <div className="view-section active" style={{ textAlign: 'center', padding: '3rem' }}>Loading prospects...</div>;
  }

  return (
    <div className="view-section active">
      {/* Sheet URLs bar */}
      {user.role === 'bda' && (
        <div className="content-card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Your Sheets:</span>
            <button className="btn btn-secondary" onClick={() => openSheet(sheetUrls.assignedSheetUrl)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
              <ExternalLink size={12} /> Assigned Leads
            </button>
            <button className="btn btn-secondary" onClick={() => openSheet(sheetUrls.prospectSheetUrl)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
              <ExternalLink size={12} /> Prospect Log
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {!sheetUrls.assignedSheetUrl && !sheetUrls.prospectSheetUrl && '(No sheets configured — ask your team lead)'}
            </span>
          </div>
        </div>
      )}

      {/* Actions bar */}
      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <strong>Prospects:</strong> {prospects.length}
            <select
              className="table-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {user.role === 'bda' && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              <UserPlus size={14} /> {showForm ? 'Cancel' : 'Add Prospect'}
            </button>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <input className="table-input" placeholder="Customer Name *" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} />
            <input className="table-input" placeholder="Contact *" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            <input className="table-input" placeholder="College" value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
            <input className="table-input" placeholder="Branch" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} />
            <input className="table-input" placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            <select className="table-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ padding: '0.5rem' }}>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="table-input" placeholder="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} style={{ gridColumn: '1 / -1' }} />
            <button className="btn btn-primary" onClick={handleAddProspect} style={{ gridColumn: '1 / -1', justifySelf: 'start' }}>
              <Save size={14} /> Save Prospect
            </button>
          </div>
        )}
      </div>

      {/* Prospects table */}
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact</th>
                <th>College</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No prospects yet.
                  </td>
                </tr>
              ) : (
                filteredProspects.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.customerName}</td>
                    <td><a href={`tel:${p.contact}`} style={{ color: 'var(--accent-blue)' }}>{p.contact}</a></td>
                    <td>{p.college}</td>
                    <td>
                      <select
                        className="table-select"
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                        style={{
                          padding: '0.25rem 0.4rem',
                          fontSize: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          backgroundColor: statusColor(p.status),
                        }}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8rem' }}>{p.remarks || '-'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.createdAt}</td>
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

export default Prospects;
