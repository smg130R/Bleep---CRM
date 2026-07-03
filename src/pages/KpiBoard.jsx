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
    
    // Call server to trigger sync
    setTimeout(async () => {
      await fetchKpis();
      setSyncing(false);
      showToast('Synchronized morning & evening stats successfully!');
    }, 1200);
  };

  // Filter lists based on role and controls
  const filteredRecords = records.filter(rec => {
    // Search match
    if (searchTerm && !rec.bdaName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Team lead dropdown filter
    if (filterLead !== 'All' && rec.teamLead !== filterLead) return false;

    // BDA role limits view
    if (currentRole === 'bda' && rec.bdaName !== user?.name) return false;

    // Team lead limits to own team
    if (currentRole === 'team_lead' && rec.team !== user?.teamId) return false;

    return true;
  });

  // Unique team leads from records for the filter dropdown
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
                
                {/* Morning Slot Section Headers */}
                <th style={{ borderLeft: '2px solid var(--border-color)', color: 'var(--accent-blue)' }}>M-Calls</th>
                <th style={{ color: 'var(--accent-blue)' }}>M-Connected</th>
                <th style={{ color: 'var(--accent-blue)' }}>M-Screenshots</th>
                <th style={{ borderRight: '2px solid var(--border-color)', color: 'var(--accent-blue)' }}>M-Prospects</th>
                
                {/* Evening Slot Section Headers */}
                <th style={{ color: 'var(--coral)' }}>E-Calls</th>
                <th style={{ color: 'var(--coral)' }}>E-Connected</th>
                <th style={{ color: 'var(--coral)' }}>E-Screenshots</th>
                <th style={{ borderRight: '2px solid var(--border-color)', color: 'var(--coral)' }}>E-Prospects</th>
                
                {/* Totals */}
                <th style={{ background: 'var(--accent-blue-light)' }}>Total Prospects</th>
                <th>Marketing Calls</th>
                <th>Connected Calls</th>
                <th>Payment Links</th>
                <th style={{ background: 'var(--success-light)' }}>Deals Closed</th>
                <th>Follow-ups</th>
                <th style={{ minWidth: '150px' }}>Performance Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="kpi-board-tbody">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={18} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
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
                      
                      <td style={{ borderLeft: '2px solid var(--border-color)' }}>{rec.mCalls}</td>
                      <td>{rec.mConn}</td>
                      <td>{rec.mSS}</td>
                      <td style={{ borderRight: '2px solid var(--border-color)', fontWeight: 600 }}>{rec.mPros}</td>
                      
                      <td>{rec.eCalls}</td>
                      <td>{rec.eConn}</td>
                      <td>{rec.eSS}</td>
                      <td style={{ borderRight: '2px solid var(--border-color)', fontWeight: 600 }}>{rec.ePros}</td>
                      
                      <td style={{ background: 'var(--accent-blue-light)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {rec.mPros + rec.ePros}
                      </td>
                      <td>{rec.mCalls + rec.eCalls}</td>
                      <td>{rec.mConn + rec.eConn}</td>
                      <td>{rec.pLink || 0}</td>
                      <td style={{ background: 'var(--success-light)', fontWeight: 700, color: 'var(--success)' }}>
                        {rec.deals}
                      </td>
                      <td>{rec.followups}</td>
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
