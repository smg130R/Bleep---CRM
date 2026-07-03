import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sheet, Users, PhoneCall, RefreshCw, Download, AlertCircle, CheckCircle, ExternalLink, Save } from 'lucide-react';

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

  useEffect(() => {
    Promise.all([
      fetchConfig(),
      fetchLeads(),
      fetchBdas(),
      fetchAssignments(),
      fetchBdasWithSheets(),
    ]).finally(() => setLoading(false));
  }, []);

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
      </div>
    </div>
  );
};

export default TeamLeadWorkspace;
