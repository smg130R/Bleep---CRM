import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sheet, Users, PhoneCall, RefreshCw, Download, AlertCircle, CheckCircle, ExternalLink, Save, Trash2, Loader, Square, CheckSquare } from 'lucide-react';

const TeamLeadWorkspace = ({ showToast }) => {
  const { user } = useAuth();
  const [masterSheetUrl, setMasterSheetUrl] = useState('');
  const [leads, setLeads] = useState([]);
  const [bdas, setBdas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [tab, setTab] = useState('leads');
  const [assignments, setAssignments] = useState([]);
  const [bdasWithSheets, setBdasWithSheets] = useState([]);
  const [editingSheet, setEditingSheet] = useState(null);
  const [callingSheets, setCallingSheets] = useState([]);
  const [selectedBda, setSelectedBda] = useState('');
  const [callingLoading, setCallingLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const lastClickedId = useRef(null);

  const toggleSelect = (id, event) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (event.shiftKey && lastClickedId.current !== null) {
        const ids = callingSheets.map(e => e.id);
        const start = ids.indexOf(lastClickedId.current);
        const end = ids.indexOf(id);
        if (start !== -1 && end !== -1) {
          const [from, to] = start < end ? [start, end] : [end, start];
          for (let i = from; i <= to; i++) next.add(ids[i]);
        }
      } else if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      lastClickedId.current = id;
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === callingSheets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(callingSheets.map(e => e.id)));
    }
    lastClickedId.current = null;
  };

  useEffect(() => {
    Promise.all([
      fetchConfig(),
      fetchLeads(),
      fetchBdas(),
      fetchAssignments(),
      fetchBdasWithSheets(),
      fetchTeamCalling(),
    ]).finally(() => setLoading(false));
  }, []);

  const fetchTeamCalling = async (bdaId) => {
    setCallingLoading(true);
    try {
      const params = bdaId ? `?bdaId=${bdaId}` : '';
      const res = await fetch(`/api/calling/team${params}`);
      if (res.ok) {
        const data = await res.json();
        setCallingSheets(data.callingSheets || []);
        if (!bdaId && data.bdas?.length > 0) {
          setBdas(data.bdas);
        }
      }
    } catch (err) {
      console.error('Fetch team calling error:', err);
    } finally {
      setCallingLoading(false);
    }
  };

  const handleRemoveCallingEntry = async (entryId) => {
    if (!window.confirm('Remove this lead from the calling sheet? The lead will be reset to unassigned.')) return;
    setRemovingId(entryId);
    try {
      const res = await fetch(`/api/calling/${entryId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        setSelectedIds(new Set());
        fetchTeamCalling(selectedBda || undefined);
      } else {
        showToast(data.message || 'Failed to remove', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    } finally {
      setRemovingId(null);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Remove ${selectedIds.size} selected leads from the calling sheet? They will be reset to unassigned.`)) return;
    setRemovingId('bulk');
    let count = 0;
    for (const entryId of selectedIds) {
      try {
        const res = await fetch(`/api/calling/${entryId}`, { method: 'DELETE' });
        if (res.ok) count++;
      } catch (err) {
        console.error('Bulk remove error:', entryId, err);
      }
    }
    setRemovingId(null);
    setSelectedIds(new Set());
    showToast(`Removed ${count} of ${selectedIds.size} entries.`);
    fetchTeamCalling(selectedBda || undefined);
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/team-lead/config');
      if (res.ok) {
        const data = await res.json();
        setMasterSheetUrl(data.masterSheetUrl || '');
      }
    } catch (err) {
      console.error('Fetch config error:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/team-lead/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Fetch leads error:', err);
    }
  };

  const fetchBdas = async () => {
    try {
      const res = await fetch('/api/team-lead/bdas');
      if (res.ok) {
        const data = await res.json();
        setBdas(data.bdas || []);
      }
    } catch (err) {
      console.error('Fetch BDAs error:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/team-lead/assignments');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error('Fetch assignments error:', err);
    }
  };

  const fetchBdasWithSheets = async () => {
    try {
      const res = await fetch('/api/team-lead/bdas-with-sheets');
      if (res.ok) {
        const data = await res.json();
        setBdasWithSheets(data.bdas || []);
      }
    } catch (err) {
      console.error('Fetch BDAs with sheets error:', err);
    }
  };

  const handleSaveBdaSheet = async (bdaId, fields) => {
    try {
      const res = await fetch(`/api/team-lead/bda-sheets/${bdaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        showToast('BDA sheet config updated.');
        fetchBdasWithSheets();
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    }
  };

  const handleSaveUrl = async () => {
    try {
      const res = await fetch('/api/team-lead/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterSheetUrl }),
      });
      if (res.ok) {
        showToast('Master sheet URL saved.');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to save', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    }
  };

  const handleImport = async () => {
    try {
      const res = await fetch('/api/team-lead/import', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        fetchLeads();
      } else {
        showToast(data.message || 'Import failed', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    }
  };

  const [deduplicating, setDeduplicating] = useState(false);
  const handleDeduplicate = async () => {
    setDeduplicating(true);
    try {
      const res = await fetch('/api/team-lead/deduplicate', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        if (data.removed > 0) fetchLeads();
      } else {
        showToast(data.message || 'Deduplicate failed', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    } finally {
      setDeduplicating(false);
    }
  };

  const handleDistribute = async () => {
    setDistributing(true);
    try {
      const res = await fetch('/api/team-lead/distribute', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        await Promise.all([fetchLeads(), fetchAssignments(), fetchBdas()]);
      } else {
        showToast(data.message || 'Distribution failed', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    } finally {
      setDistributing(false);
    }
  };

  const handleReassignNa = async () => {
    setReassigning(true);
    try {
      const res = await fetch('/api/team-lead/reassign-na', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        await Promise.all([fetchLeads(), fetchAssignments(), fetchBdas()]);
      } else {
        showToast(data.message || 'Reassignment failed', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    } finally {
      setReassigning(false);
    }
  };

  const unassignedCount = leads.filter(l => l.status === 'unassigned').length;
  const naCount = leads.filter(l => l.status === 'na').length;
  const assignedCount = leads.filter(l => l.status === 'assigned').length;
  const droppedCount = leads.filter(l => l.status === 'dropped').length;

  const statusBadge = (status) => {
    const colors = {
      unassigned: 'var(--text-muted)',
      assigned: 'var(--accent-blue)',
      na: 'var(--warning)',
      ni: 'var(--danger)',
      form_shared: 'var(--success)',
      screenshot_shared: 'var(--success)',
      busy: 'var(--warning)',
      switch_off: 'var(--text-muted)',
      out_of_service: 'var(--danger)',
      dropped: 'var(--danger)',
    };
    return { backgroundColor: colors[status] || 'var(--text-muted)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' };
  };

  if (loading) {
    return <div className="view-section active" style={{ textAlign: 'center', padding: '3rem' }}>Loading workspace...</div>;
  }

  return (
    <div className="view-section active">
      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sheet size={18} /> Master Google Sheet
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="table-input"
            placeholder="Paste your master Google Sheet URL here..."
            value={masterSheetUrl}
            onChange={(e) => setMasterSheetUrl(e.target.value)}
            style={{ flex: 1, minWidth: '300px' }}
          />
          <button className="btn btn-primary" onClick={handleSaveUrl} style={{ whiteSpace: 'nowrap' }}>
            <CheckCircle size={14} /> Save URL
          </button>
          <button className="btn btn-secondary" onClick={handleImport}>
            <Download size={14} /> Import
          </button>
          <button className="btn btn-secondary" onClick={handleDeduplicate} disabled={deduplicating}>
            <RefreshCw size={14} className={deduplicating ? 'animate-spin' : ''} /> {deduplicating ? 'Deduplicating...' : 'Fix Duplicates'}
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Auto-detects columns by header name (Name, Contact/Phone, College, Branch, Year, etc.). Extra columns ignored.
        </p>
      </div>

      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div><strong>Total Leads:</strong> {leads.length}</div>
            <div><strong>Unassigned:</strong> {unassignedCount}</div>
            <div><strong>Assigned:</strong> {assignedCount}</div>
            <div><strong>NA:</strong> {naCount}</div>
            <div><strong>Dropped:</strong> {droppedCount}</div>
            <div><strong>BDAs Present:</strong> {bdas.length}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleDistribute}
              disabled={distributing || unassignedCount === 0 || bdas.length === 0}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Users size={14} /> {distributing ? 'Distributing...' : 'Distribute Leads'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleReassignNa}
              disabled={reassigning || naCount === 0}
              style={{ whiteSpace: 'nowrap' }}
            >
              <RefreshCw size={14} /> {reassigning ? 'Reassigning...' : 'Reassign NA'}
            </button>
          </div>
        </div>
      </div>

      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button
            className={`btn ${tab === 'leads' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('leads')}
            style={{ borderRadius: 0, border: 'none', flex: 1 }}
          >
            Leads ({leads.length})
          </button>
          <button
            className={`btn ${tab === 'assignments' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('assignments')}
            style={{ borderRadius: 0, border: 'none', flex: 1 }}
          >
            Assignment History ({assignments.length})
          </button>
          <button
            className={`btn ${tab === 'bdas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('bdas')}
            style={{ borderRadius: 0, border: 'none', flex: 1 }}
          >
            BDA Sheets ({bdasWithSheets.length})
          </button>
          <button
            className={`btn ${tab === 'calling' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('calling')}
            style={{ borderRadius: 0, border: 'none', flex: 1 }}
          >
            <PhoneCall size={14} /> Calling Sheets ({callingSheets.length})
          </button>
        </div>

        {tab === 'leads' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>College</th>
                  <th>Status</th>
                  <th>NA Count</th>
                  <th>Assignee</th>
                  <th>Assigned</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No leads yet. Import from master sheet or add manually.
                    </td>
                  </tr>
                ) : (
                  leads.map(lead => (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 600 }}>{lead.customerName}</td>
                      <td><a href={`tel:${lead.contact}`} style={{ color: 'var(--accent-blue)' }}>{lead.contact}</a></td>
                      <td>{lead.college}</td>
                      <td><span style={statusBadge(lead.status)}>{lead.status}</span></td>
                      <td>{lead.naCount}</td>
                      <td>{lead.assigneeName || '-'}</td>
                      <td>{lead.assignedInMaster ? 'Yes' : 'No'}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.createdAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'assignments' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Assigned To</th>
                  <th>Assigned By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No assignment history yet.
                    </td>
                  </tr>
                ) : (
                  assignments.map(a => (
                    <tr key={a.id}>
                      <td>{a.leadId?.slice(0, 8) || '-'}</td>
                      <td>{a.assigneeName || a.assignedTo}</td>
                      <td>{a.assignerName || a.assignedBy || '-'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{a.assignedDate}</td>
                      <td><span style={statusBadge(a.status)}>{a.status || 'Pending'}</span></td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'bdas' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>BDA Name</th>
                  <th>Assigned Leads Sheet URL / Tab</th>
                  <th>Prospect Sheet URL / Tab</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bdasWithSheets.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No BDAs found in your team.
                    </td>
                  </tr>
                ) : (
                  bdasWithSheets.map(bda => (
                    <tr key={bda.id}>
                      <td style={{ fontWeight: 600 }}>{bda.name}</td>
                      <td>
                        {editingSheet === `assigned-${bda.id}` ? (
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <input className="table-input" type="text"
                              id={`url-a-${bda.id}`}
                              defaultValue={bda.assignedSheetUrl || ''}
                              placeholder="Sheet URL"
                              style={{ flex: 1, minWidth: '140px' }} autoFocus />
                            <input className="table-input" type="text"
                              id={`tab-a-${bda.id}`}
                              defaultValue={bda.assignedSheetTab || 'Sheet1'}
                              placeholder="Tab name"
                              style={{ width: '90px', fontSize: '0.8rem' }} />
                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                handleSaveBdaSheet(bda.id, {
                                  assignedSheetUrl: document.getElementById(`url-a-${bda.id}`).value,
                                  assignedSheetTab: document.getElementById(`tab-a-${bda.id}`).value || 'Sheet1',
                                });
                                setEditingSheet(null);
                              }}>
                              <Save size={12} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ cursor: 'pointer', color: 'var(--accent-blue)', fontSize: '0.8rem' }}
                            onClick={() => setEditingSheet(`assigned-${bda.id}`)}
                            title="Click to edit"
                          >
                            {bda.assignedSheetUrl
                              ? <><ExternalLink size={12} style={{ marginRight: '0.25rem' }} />{bda.assignedSheetUrl.slice(0, 30)}... [{bda.assignedSheetTab || 'Sheet1'}]</>
                              : 'Set URL + Tab'}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingSheet === `prospect-${bda.id}` ? (
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <input className="table-input" type="text"
                              id={`url-p-${bda.id}`}
                              defaultValue={bda.prospectSheetUrl || ''}
                              placeholder="Sheet URL"
                              style={{ flex: 1, minWidth: '140px' }} autoFocus />
                            <input className="table-input" type="text"
                              id={`tab-p-${bda.id}`}
                              defaultValue={bda.prospectSheetTab || 'Sheet1'}
                              placeholder="Tab name"
                              style={{ width: '90px', fontSize: '0.8rem' }} />
                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                handleSaveBdaSheet(bda.id, {
                                  prospectSheetUrl: document.getElementById(`url-p-${bda.id}`).value,
                                  prospectSheetTab: document.getElementById(`tab-p-${bda.id}`).value || 'Sheet1',
                                });
                                setEditingSheet(null);
                              }}>
                              <Save size={12} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ cursor: 'pointer', color: 'var(--accent-blue)', fontSize: '0.8rem' }}
                            onClick={() => setEditingSheet(`prospect-${bda.id}`)}
                            title="Click to edit"
                          >
                            {bda.prospectSheetUrl
                              ? <><ExternalLink size={12} style={{ marginRight: '0.25rem' }} />{bda.prospectSheetUrl.slice(0, 30)}... [{bda.prospectSheetTab || 'Sheet1'}]</>
                              : 'Set URL + Tab'}
                          </span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => setEditingSheet(null)}
                        >
                          Done
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'calling' && (
          <div>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter by BDA:</label>
              <select
                className="table-select"
                value={selectedBda}
                onChange={e => { setSelectedBda(e.target.value); fetchTeamCalling(e.target.value || undefined); }}
                style={{ width: '200px' }}
              >
                <option value="">All BDAs</option>
                {bdas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${callingSheets.length} entries`}
              </span>
              {selectedIds.size > 0 && (
                <button
                  className="btn btn-danger"
                  onClick={handleBulkRemove}
                  disabled={removingId === 'bulk'}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {removingId === 'bulk' ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {' Remove Selected (' + selectedIds.size + ')'}
                </button>
              )}
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <span onClick={selectAll} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {selectedIds.size === callingSheets.length && callingSheets.length > 0
                          ? <CheckSquare size={16} color="#2563EB" />
                          : <Square size={16} color="#9CA3AF" />}
                      </span>
                    </th>
                    <th>BDA</th>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>College</th>
                    <th>Branch</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>NA Count</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {callingLoading ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <Loader size={18} className="animate-spin" style={{ display: 'inline', marginRight: 8 }} />
                        Loading...
                      </td>
                    </tr>
                  ) : callingSheets.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No calling sheet entries found for your team's BDAs.
                      </td>
                    </tr>
                  ) : (
                    callingSheets.map(entry => (
                      <tr key={entry.id} style={{ background: selectedIds.has(entry.id) ? '#EFF6FF' : undefined }}>
                        <td>
                          <span
                            onClick={e => toggleSelect(entry.id, e)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            {selectedIds.has(entry.id)
                              ? <CheckSquare size={16} color="#2563EB" />
                              : <Square size={16} color="#9CA3AF" />}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{entry.bdaName}</td>
                        <td>{entry.customerName}</td>
                        <td><a href={`tel:${entry.contact}`} style={{ color: 'var(--accent-blue)' }}>{entry.contact}</a></td>
                        <td style={{ fontSize: '0.8rem' }}>{entry.college}</td>
                        <td style={{ fontSize: '0.8rem' }}>{entry.branch}</td>
                        <td style={{ fontSize: '0.8rem' }}>{entry.year}</td>
                        <td><span style={statusBadge((entry.status || 'pending').toLowerCase().replace(/\s+/g, '_'))}>{entry.status}</span></td>
                        <td>{entry.naCount || 0}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.lastUpdated}</td>
                        <td>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 2 }}
                            onClick={e => handleRemoveCallingEntry(entry.id)}
                            disabled={removingId === entry.id}
                          >
                            {removingId === entry.id ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
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

export default TeamLeadWorkspace;
