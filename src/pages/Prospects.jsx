import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Save, ExternalLink, DollarSign, TrendingUp, Users, CreditCard, RefreshCw, Phone } from 'lucide-react';

const statusOptions = ['Prospect', 'Follow-up', 'NA', 'NI', 'Call Back', 'Registration Done', 'Converted', 'Lost'];
const paymentOptions = ['pending', 'slot_booking', 'partial_paid', 'fully_paid', 'cancelled'];

const statusColor = (s) => ({
  Prospect: 'var(--accent-blue)',
  'Follow-up': 'var(--warning)',
  NA: 'var(--danger)',
  NI: 'var(--danger)',
  'Call Back': 'var(--info)',
  'Registration Done': 'var(--success)',
  Converted: 'var(--purple)',
  Lost: 'var(--text-muted)',
})[s] || 'var(--text-muted)';

const paymentBadge = (s) => ({
  pending: 'badge pending',
  slot_booking: 'badge pending',
  partial_paid: 'badge average',
  fully_paid: 'badge excellent',
  cancelled: 'badge no-update',
})[s] || 'badge';

const Prospects = ({ showToast }) => {
  const { user } = useAuth();
  const [prospects, setProspects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [sheetUrls, setSheetUrls] = useState({ assignedSheetUrl: '', prospectSheetUrl: '' });
  const [syncing, setSyncing] = useState(false);

  const emptyForm = { customerName: '', contact: '', email: '', college: '', branch: '', year: '', domain: '', month: '', experience: '', state: '', status: 'Prospect', remarks: '', payment_status: 'pending', slot_amount: '', amount_paid: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([fetchProspects(), fetchSheetUrls()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') setFiltered(prospects);
    else setFiltered(prospects.filter(p => p.status === statusFilter));
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
        setSheetUrls({ assignedSheetUrl: data.user?.assignedSheetUrl || '', prospectSheetUrl: data.user?.prospectSheetUrl || '' });
      }
    } catch (err) {
      console.error('Fetch sheet URLs error:', err);
    }
  };

  const handleAdd = async () => {
    if (!form.customerName || !form.contact) { showToast('Name and contact are required.', true); return; }
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast('Prospect added.');
        setShowForm(false);
        setForm(emptyForm);
        fetchProspects();
      } else {
        try {
          const err = await res.json();
          showToast(err.message || 'Failed.', true);
        } catch { showToast('Request failed', true); }
      }
    } catch { showToast('Connection error', true); }
  };

  const handleFieldChange = async (id, field, value) => {
    const old = [...prospects];
    setProspects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    try {
      const res = await fetch(`/api/prospects/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) setProspects(old);
      else if (field === 'slot_amount' || field === 'amount_paid') fetchProspects(); // refresh for recalculated remaining
    } catch { setProspects(old); }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({
      customerName: p.customerName, contact: p.contact, email: p.email || '', college: p.college || '',
      branch: p.branch || '', year: p.year || '', domain: p.domain || '', month: p.month || '',
      experience: p.experience || '', state: p.state || '', status: p.status, remarks: p.remarks || '',
      payment_status: p.payment_status || 'pending', slot_amount: p.slot_amount || 0, amount_paid: p.amount_paid || 0,
    });
  };

  const handleEditBlur = async (id, field, value) => {
    const old = { ...editForm };
    setEditForm(prev => ({ ...prev, [field]: value }));
    try {
      const res = await fetch(`/api/prospects/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        setEditForm(old);
        showToast('Failed to save', true);
      } else if (field === 'slot_amount' || field === 'amount_paid') {
        fetchProspects();
      }
    } catch {
      setEditForm(old);
      showToast('Connection error', true);
    }
  };

  const syncFromSheet = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/prospects/sync', { method: 'POST' });
      if (res.ok) {
        showToast('Synced from sheet successfully!');
        fetchProspects();
      } else {
        try {
          const err = await res.json();
          showToast(err.message || 'Sync failed. Make sure your prospect sheet is shared with the service account.', true);
        } catch {
          const text = await res.text();
          showToast(text || 'Sync failed (unknown error)', true);
        }
      }
    } catch (e) {
      console.error('Sync error:', e);
      showToast('Connection error: ' + e.message, true);
    } finally {
      setSyncing(false);
    }
  };

  const openSheet = (url) => {
    if (url) window.open(url, '_blank', 'noopener');
    else showToast('No sheet URL configured.', true);
  };

  // Summary stats
  const total = prospects.length;
  const slotBookings = prospects.filter(p => p.payment_status === 'slot_booking' || p.payment_status === 'partial_paid' || p.payment_status === 'fully_paid');
  const totalSlotAmt = slotBookings.reduce((s, p) => s + parseFloat(p.slot_amount || 0), 0);
  const totalPaid = prospects.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
  const totalRemaining = prospects.reduce((s, p) => s + parseFloat(p.remaining || 0), 0);

  if (loading) {
    return <div className="view-section active" style={{ textAlign: 'center', padding: '3rem' }}>Loading prospects...</div>;
  }

  return (
    <div className="view-section active">
      {/* Sheet URLs */}
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

      {/* Payment Summary */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card blue">
          <div className="kpi-card-header"><span className="kpi-card-title">Total Prospects</span><Users size={18} /></div>
          <div className="kpi-card-value">{total}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-card-header"><span className="kpi-card-title">Slot Bookings</span><CreditCard size={18} /></div>
          <div className="kpi-card-value">{slotBookings.length}</div>
          <div className="kpi-card-footer">₹{totalSlotAmt.toLocaleString()} total slot value</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-card-header"><span className="kpi-card-title">Amount Collected</span><DollarSign size={18} /></div>
          <div className="kpi-card-value">₹{totalPaid.toLocaleString()}</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-card-header"><span className="kpi-card-title">Outstanding</span><TrendingUp size={18} /></div>
          <div className="kpi-card-value">₹{totalRemaining.toLocaleString()}</div>
          <div className="kpi-card-footer">pending collection</div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <strong>Filter:</strong>
            <select className="table-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>
              <option value="all">All Statuses</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {user.role === 'bda' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={syncFromSheet} disabled={syncing}>
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Refresh from Sheet'}
              </button>
              <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                <UserPlus size={14} /> {showForm ? 'Cancel' : 'Add Prospect'}
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <input className="table-input" placeholder="Name *" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} />
            <input className="table-input" placeholder="Contact *" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
            <input className="table-input" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <input className="table-input" placeholder="College" value={form.college} onChange={e => setForm({...form, college: e.target.value})} />
            <input className="table-input" placeholder="Branch" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} />
            <input className="table-input" placeholder="Year" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
            <input className="table-input" placeholder="Domain Chosen" value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} />
            <input className="table-input" placeholder="Month" value={form.month} onChange={e => setForm({...form, month: e.target.value})} />
            <input className="table-input" placeholder="Experience" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} />
            <input className="table-input" placeholder="State" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
            <select className="table-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ padding: '0.5rem' }}>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="table-select" value={form.payment_status} onChange={e => setForm({...form, payment_status: e.target.value})} style={{ padding: '0.5rem' }}>
              {paymentOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="table-input" type="number" placeholder="Slot Amount (₹)" value={form.slot_amount} onChange={e => setForm({...form, slot_amount: e.target.value})} />
            <input className="table-input" type="number" placeholder="Amount Paid (₹)" value={form.amount_paid} onChange={e => setForm({...form, amount_paid: e.target.value})} />
            {form.slot_amount && <div style={{ fontSize: '0.8rem', alignSelf: 'center', color: 'var(--text-muted)' }}>Remaining: ₹{Math.max(0, (parseFloat(form.slot_amount)||0) - (parseFloat(form.amount_paid)||0))}</div>}
            <input className="table-input" placeholder="Remarks" value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} style={{ gridColumn: '1 / -1' }} />
            <button className="btn btn-primary" onClick={handleAdd} style={{ gridColumn: '1 / -1', justifySelf: 'start' }}>
              <Save size={14} /> Save Prospect
            </button>
          </div>
        )}
      </div>

      {/* Prospects table */}
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table data-table-bordered">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>College</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Slot Amt</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Month</th>
                <th>State</th>
                <th>Remarks</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={14} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No prospects yet.</td></tr>
              ) : (
                filtered.map(p => (
                  editingId === p.id ? (
                    <tr key={p.id}>
                      <td><input className="table-input" value={editForm.customerName} onChange={e => setEditForm({...editForm, customerName: e.target.value})} onBlur={e => handleEditBlur(p.id, 'customerName', e.target.value)} style={{ minWidth: '80px' }} /></td>
                      <td><input className="table-input" value={editForm.contact} onChange={e => setEditForm({...editForm, contact: e.target.value})} onBlur={e => handleEditBlur(p.id, 'contact', e.target.value)} style={{ minWidth: '90px' }} /></td>
                      <td><input className="table-input" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} onBlur={e => handleEditBlur(p.id, 'email', e.target.value)} style={{ minWidth: '100px' }} /></td>
                      <td><input className="table-input" value={editForm.college} onChange={e => setEditForm({...editForm, college: e.target.value})} onBlur={e => handleEditBlur(p.id, 'college', e.target.value)} style={{ minWidth: '80px' }} /></td>
                      <td><input className="table-input" value={editForm.domain} onChange={e => setEditForm({...editForm, domain: e.target.value})} onBlur={e => handleEditBlur(p.id, 'domain', e.target.value)} style={{ minWidth: '80px' }} /></td>
                      <td>
                        <select className="table-select" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} onBlur={e => handleEditBlur(p.id, 'status', e.target.value)}
                          style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', color: '#000', backgroundColor: statusColor(editForm.status) }}>
                          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="table-select" value={editForm.payment_status} onChange={e => setEditForm({...editForm, payment_status: e.target.value})} onBlur={e => handleEditBlur(p.id, 'payment_status', e.target.value)}
                          style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}>
                          {paymentOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td><input className="table-input" type="number" value={editForm.slot_amount} onChange={e => setEditForm({...editForm, slot_amount: e.target.value})} onBlur={e => handleEditBlur(p.id, 'slot_amount', e.target.value)} style={{ width: '70px' }} /></td>
                      <td><input className="table-input" type="number" value={editForm.amount_paid} onChange={e => setEditForm({...editForm, amount_paid: e.target.value})} onBlur={e => handleEditBlur(p.id, 'amount_paid', e.target.value)} style={{ width: '70px' }} /></td>
                      <td style={{ fontWeight: 600, color: 'var(--danger)' }}>₹{Math.max(0, (parseFloat(editForm.slot_amount)||0) - (parseFloat(editForm.amount_paid)||0))}</td>
                      <td><input className="table-input" value={editForm.month} onChange={e => setEditForm({...editForm, month: e.target.value})} onBlur={e => handleEditBlur(p.id, 'month', e.target.value)} style={{ width: '70px' }} /></td>
                      <td><input className="table-input" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} onBlur={e => handleEditBlur(p.id, 'state', e.target.value)} style={{ width: '70px' }} /></td>
                      <td><input className="table-input" value={editForm.remarks} onChange={e => setEditForm({...editForm, remarks: e.target.value})} onBlur={e => handleEditBlur(p.id, 'remarks', e.target.value)} style={{ minWidth: '100px' }} /></td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => setEditingId(null)}>X</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => startEdit(p)} title="Click to edit">
                      <td style={{ fontWeight: 600 }}>{p.customerName}</td>
                      <td>
                        <a href={`tel:${p.contact}`} style={{ color: 'var(--accent-blue)' }}
                          onClick={e => {
                            e.stopPropagation();
                            fetch('/api/calling/track-sales-call', { method: 'POST', credentials: 'include' }).catch(() => {});
                          }}>
                          <Phone size={12} style={{ marginRight: '0.2rem' }} />{p.contact}
                        </a>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{p.email || '-'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{p.college || '-'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{p.domain || '-'}</td>
                      <td>
                        <select className="table-select" value={p.status} onChange={(e) => { e.stopPropagation(); handleFieldChange(p.id, 'status', e.target.value); }}
                          style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#000', backgroundColor: statusColor(p.status) }}
                          onClick={e => e.stopPropagation()}>
                          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td><span className={paymentBadge(p.payment_status)} style={{ fontSize: '0.7rem' }}>{p.payment_status?.replace('_', ' ') || 'pending'}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>₹{parseFloat(p.slot_amount || 0).toLocaleString()}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>₹{parseFloat(p.amount_paid || 0).toLocaleString()}</td>
                      <td style={{ fontSize: '0.8rem', color: parseFloat(p.remaining || 0) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                        ₹{parseFloat(p.remaining || 0).toLocaleString()}
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>{p.month || '-'}</td>
                      <td style={{ fontSize: '0.75rem' }}>{p.state || '-'}</td>
                      <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem' }}>{p.remarks || '-'}</td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.createdAt}</td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
          Click any row to edit all fields. Total: {filtered.length} prospect{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default Prospects;