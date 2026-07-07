import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Search, Filter } from 'lucide-react';

const KpiBoard = ({ dateFilter, showToast }) => {
  const { user } = useAuth();
  const currentRole = user?.role;

  const [records, setRecords] = useState([]);
  const [filterLead, setFilterLead] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchKpis = async () => {
    try {
      const res = await fetch(`/api/kpi/board-all?date=${new Date().toISOString().split('T')[0]}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
      }
    } catch (err) {
      console.error('Error fetching KPI Board:', err);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, [currentRole, dateFilter]);

  const handleSync = async () => {
    setSyncing(true);
    showToast('Syncing records with BDA Google Sheets...');
    setTimeout(async () => {
      await fetchKpis();
      setSyncing(false);
      showToast('Synced successfully!');
    }, 1200);
  };

  const filteredRecords = records.filter(rec => {
    if (searchTerm && !rec.bdaName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterLead !== 'All' && rec.teamLead !== filterLead) return false;
    if (currentRole === 'bda' && rec.bdaName !== user?.name) return false;
    if (currentRole === 'team_lead' && rec.team !== user?.teamId) return false;
    return true;
  });

  const teamLeadOptions = [...new Set(records.map(r => r.teamLead).filter(Boolean))];

  const getStatusBadgeClass = (score) => {
    if (score >= 90) return 'badge excellent';
    if (score >= 70) return 'badge good';
    if (score >= 45) return 'badge average';
    return 'badge needs-push';
  };

  const getStatusText = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 45) return 'Average';
    return 'Needs Push';
  };

  const getProgressBarColor = (score) => {
    if (score < 40) return 'red';
    if (score < 75) return 'orange';
    return 'green';
  };

  return (
    <div className="view-section active" id="kpi-board-view">
      <div className="table-controls-panel">
        <div className="search-wrapper">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search BDA name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          {currentRole !== 'team_lead' && currentRole !== 'bda' && (
            <div className="select-wrapper">
              <Filter size={14} className="filter-icon" />
              <select 
                id="kpi-team-lead-filter" 
                value={filterLead}
                onChange={(e) => setFilterLead(e.target.value)}
              >
                <option value="All">All Division Leads</option>
                {teamLeadOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {currentRole === 'admin' && (
            <button 
              className={`btn btn-primary ${syncing ? 'loading' : ''}`}
              id="kpi-sync-btn"
              onClick={handleSync}
              disabled={syncing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Google Sheets'}
            </button>
          )}
        </div>
      </div>

      <div className="content-card" style={{ marginTop: '1.5rem', padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table kpi-board-table">
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg-card)', borderRight: '1px solid var(--border-color)' }}>BDA Name</th>
                <th>Team Lead</th>
                
                {/* Marketing Call 1 (11 AM - 2 PM) */}
                <th style={{ borderLeft: '2px solid var(--border-color)', color: 'var(--accent-blue)', fontSize: '0.7rem' }} colSpan={3}>MC1 (11-2)</th>
                
                {/* Marketing Call 2 (3:15 PM - 5 PM) */}
                <th style={{ borderLeft: '2px solid var(--border-color)', color: 'var(--coral)', fontSize: '0.7rem' }} colSpan={3}>MC2 (3:15-5)</th>
                
                {/* Sales & Follow-up */}
                <th style={{ borderLeft: '2px solid var(--border-color)', color: '#7c3aed', fontSize: '0.7rem' }} colSpan={2}>Sales & F/up</th>
                
                <th>Total Prospects</th>
                <th>Total Calls</th>
                <th>Connects</th>
                <th>Screenshots</th>
                <th style={{ background: 'var(--success-light)' }}>Deals</th>
                <th style={{ minWidth: '150px' }}>Score</th>
                <th>Status</th>
              </tr>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg-card)', borderRight: '1px solid var(--border-color)' }}></th>
                <th></th>
                {/* MC1 sub-headers */}
                <th style={{ borderLeft: '2px solid var(--border-color)', fontWeight: 500 }}>Calls</th>
                <th style={{ fontWeight: 500 }}>Conn</th>
                <th style={{ fontWeight: 500 }}>Pros</th>
                {/* MC2 sub-headers */}
                <th style={{ borderLeft: '2px solid var(--border-color)', fontWeight: 500 }}>Calls</th>
                <th style={{ fontWeight: 500 }}>Conn</th>
                <th style={{ fontWeight: 500 }}>Pros</th>
                {/* Sales sub-headers */}
                <th style={{ borderLeft: '2px solid var(--border-color)', fontWeight: 500 }}>F/ups</th>
                <th style={{ fontWeight: 500 }}>Deals</th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody id="kpi-board-tbody">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const score = rec.perfScore;
                  return (
                    <tr key={idx}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 5, background: 'var(--bg-card)', fontWeight: 600, color: 'var(--primary-navy)', borderRight: '1px solid var(--border-color)' }}>
                        {rec.bdaName}
                      </td>
                      <td>{rec.teamLead || 'No Lead'}</td>
                      
                      {/* MC1 */}
                      <td style={{ borderLeft: '2px solid var(--border-color)' }}>{rec.mCalls}</td>
                      <td>{rec.mConn}</td>
                      <td style={{ fontWeight: 600 }}>{rec.mPros}</td>
                      
                      {/* MC2 */}
                      <td style={{ borderLeft: '2px solid var(--border-color)' }}>{rec.eCalls}</td>
                      <td>{rec.eConn}</td>
                      <td style={{ fontWeight: 600 }}>{rec.ePros}</td>
                      
                      {/* Sales */}
                      <td style={{ borderLeft: '2px solid var(--border-color)' }}>{rec.followups}</td>
                      <td>{rec.deals}</td>
                      
                      <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {rec.mPros + rec.ePros}
                      </td>
                      <td>{rec.mCalls + rec.eCalls}</td>
                      <td>{rec.mConn + rec.eConn}</td>
                      <td>{rec.mSS}</td>
                      <td style={{ background: 'var(--success-light)', fontWeight: 700, color: 'var(--success)' }}>
                        {rec.deals}
                      </td>
                      <td>
                        <div className="table-progress-wrapper">
                          <div className="table-progress-bg">
                            <div 
                              className={`table-progress-bar ${getProgressBarColor(score)}`} 
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                          <span className="table-progress-text">{score}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(score)}>
                          {getStatusText(score)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KpiBoard;
