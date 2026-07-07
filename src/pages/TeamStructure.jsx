import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Network, Users, Phone, PhoneCall, Trophy, ArrowLeft, ShieldAlert } from 'lucide-react';

const TeamStructure = ({ showToast }) => {
  const { user } = useAuth();
  const currentRole = user?.role;

  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamDetail, setTeamDetail] = useState(null);
  const [teamsList, setTeamsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setPageLoading(true);
      const res = await fetch('/api/employees/teams', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTeamsList(data.teams || []);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchTeamPerformance = async (teamId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employees/teams/${teamId}/bda-performance?date=${new Date().toISOString().split('T')[0]}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTeamDetail(data);
      } else {
        const errData = await res.json();
        showToast(errData.message || 'Error loading team data', true);
      }
    } catch (err) {
      console.error('Error fetching team performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamPerformance(selectedTeamId);
    }
  }, [selectedTeamId]);

  const isAllowedToViewAll = ['admin', 'ops_head'].includes(currentRole);
  const isTeamLead = currentRole === 'team_lead';

  const visibleTeams = teamsList.filter(team => {
    if (isAllowedToViewAll) return true;
    if (isTeamLead && team.leadName === user?.name) return true;
    return false;
  });

  const handleTeamClick = (teamId) => {
    if (isTeamLead && user?.teamId !== teamId) {
      showToast('Access denied: You can only drill down into your own team.', true);
      return;
    }
    setSelectedTeamId(teamId);
  };

  const handleBackToTeams = () => {
    setSelectedTeamId(null);
    setTeamDetail(null);
  };

  const getStatusClass = (status) => {
    if (status === 'Excellent') return 'badge excellent';
    if (status === 'Good') return 'badge good';
    if (status === 'Average') return 'badge average';
    return 'badge needs-push';
  };

  const selectedTeam = teamsList.find(t => t.id === selectedTeamId);

  const getAggregates = () => {
    if (!teamDetail?.performance) return { size: 0, calls: 0, connects: 0, prospects: 0, deals: 0 };
    const perf = teamDetail.performance;
    return {
      size: perf.length,
      calls: perf.reduce((s, b) => s + b.mCalls + b.eCalls, 0),
      connects: perf.reduce((s, b) => s + b.mConn + b.eConn, 0),
      prospects: perf.reduce((s, b) => s + b.mPros + b.ePros, 0),
      deals: perf.reduce((s, b) => s + b.deals, 0)
    };
  };

  if (!isAllowedToViewAll && !isTeamLead) {
    return (
      <div className="view-section active">
        <div className="auth-badge" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '2rem' }}>
          <ShieldAlert size={24} style={{ marginBottom: '1rem' }} />
          <h3>Access Denied</h3>
          <p>BDAs and HR associates do not have clearance to view internal team structure and individual BDA score cards.</p>
        </div>
      </div>
    );
  }

  if (selectedTeamId && teamDetail) {
    const agg = getAggregates();
    return (
      <div className="view-section active" id="team-structure-detail">
        <button 
          className="btn btn-secondary" 
          onClick={handleBackToTeams} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={16} />
          Back to Teams Overview
        </button>

        <div className="role-welcome-banner" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>Team {teamDetail.teamId} Division Details</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
              Division Lead: <strong>{teamDetail.teamLead?.name || selectedTeam?.leadName || 'N/A'}</strong> ({teamDetail.teamLead?.email || selectedTeam?.leadEmail || 'N/A'})
            </p>
          </div>
        </div>

        <div className="dashboard-grid" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
          <div className="kpi-card blue">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Active BDA Headcount</span>
              <div className="kpi-card-icon"><Users size={18} /></div>
            </div>
            <div className="kpi-card-value">{agg.size}</div>
            <div className="kpi-card-footer">All profiles logged active</div>
          </div>

          <div className="kpi-card green">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Division Outbound Calls</span>
              <div className="kpi-card-icon"><Phone size={18} /></div>
            </div>
            <div className="kpi-card-value">{agg.calls}</div>
            <div className="kpi-card-footer">Avg connects: {agg.calls ? Math.round(agg.connects / agg.calls * 100) : 0}%</div>
          </div>

          <div className="kpi-card orange">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Prospects Created</span>
              <div className="kpi-card-icon"><Trophy size={18} /></div>
            </div>
            <div className="kpi-card-value">{agg.prospects}</div>
            <div className="kpi-card-footer">Daily Target: 10</div>
          </div>

          <div className="kpi-card purple">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Deals Closed Today</span>
              <div className="kpi-card-icon"><PhoneCall size={18} /></div>
            </div>
            <div className="kpi-card-value">{agg.deals}</div>
            <div className="kpi-card-footer">₹{(agg.deals * 12500).toLocaleString('en-IN')} logged today</div>
          </div>
        </div>

        <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Individual BDA Productivity Logs</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>BDA Name</th>
                  <th>MC1 Calls (11-2)</th>
                  <th>MC1 Conn</th>
                  <th>MC1 Pros</th>
                  <th>MC2 Calls (3:15-5)</th>
                  <th>MC2 Conn</th>
                  <th>MC2 Pros</th>
                  <th>Screenshots</th>
                  <th>Deals</th>
                  <th>Follow-ups</th>
                  <th style={{ minWidth: '150px' }}>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '2rem' }}>Loading team stats...</td>
                  </tr>
                ) : !teamDetail.performance?.length ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No BDA records found for this team.
                    </td>
                  </tr>
                ) : (
                  teamDetail.performance?.map((bda, idx) => {
                    const score = bda.perfScore;
                    let bdaStatus = 'No Update';
                    if (score >= 90) bdaStatus = 'Excellent';
                    else if (score >= 70) bdaStatus = 'Good';
                    else if (score >= 45) bdaStatus = 'Average';
                    else bdaStatus = 'Needs Push';

                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{bda.name}</td>
                        <td>{bda.mCalls}</td>
                        <td>{bda.mConn}</td>
                        <td>{bda.mPros}</td>
                        <td>{bda.eCalls}</td>
                        <td>{bda.eConn}</td>
                        <td>{bda.ePros}</td>
                        <td>{bda.mSS || 0}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{bda.deals}</td>
                        <td>{bda.followups}</td>
                        <td>
                          <div className="table-progress-wrapper">
                            <div className="table-progress-bg">
                              <div 
                                className={`table-progress-bar ${score < 40 ? 'red' : score < 75 ? 'orange' : 'green'}`} 
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>
                            <span className="table-progress-text">{score}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={getStatusClass(bdaStatus)}>
                            {bdaStatus}
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
  }

  return (
    <div className="view-section active" id="team-structure-view">
      {pageLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading teams...</div>
      ) : visibleTeams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No teams found. Create teams from the Employee Management page.
        </div>
      ) : (
        <div className="team-grid" id="team-cards-container">
          {visibleTeams.map((team) => (
            <div 
              key={team.id} 
              className="team-card clickable"
              onClick={() => handleTeamClick(team.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="team-card-header">
                <div className="team-card-info">
                  <h3>Team {team.id} Division</h3>
                  <p>Lead: {team.leadName || 'Unassigned'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamStructure;
