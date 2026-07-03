import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const Header = ({ activePage, dateFilter, setDateFilter, onOpenComplaintModal }) => {
  const { user } = useAuth();
  if (!user) return null;

  const currentRole = user.role;

  const titleMap = {
    dashboard: { title: "Company Dashboard", subtitle: "Overall performance indicators & company metrics" },
    'kpi-board': { title: "KPI Board", subtitle: "Real-time BDA morning & evening sales logs" },
    'team-structure': { title: "Team Structure", subtitle: "Company hierarchy tree & sales division cards" },
    'team-lead-workspace': { title: "Lead Workspace", subtitle: "Master sheet management & lead distribution" },
    'employee-master': { title: "Employee Master", subtitle: "Active company employee profiles & directory" },
    'marketing-calling': { title: "Marketing Calls", subtitle: "Assigned customer calling sheets" },
    'prospects': { title: "Prospect & Registration Log", subtitle: "Track registrations and prospect conversions" },
    'follow-ups': { title: "Customer Follow-ups", subtitle: "Schedules of pending callbacks & lead statuses" },
    reports: { title: "Visual Analytics Reports", subtitle: "Data visualizations, conversion ratios & export catalogs" },
    'hr-desk': { title: "HR Desk Support", subtitle: "Announcements, leaves, documentation & milestones" },
    settings: { title: "Platform Settings", subtitle: "Google Sheets linking, sync scheduling & KPI targets" }
  };

  const pageInfo = titleMap[activePage] || { title: 'Bleep CRM', subtitle: 'Office Management Board' };

  // Role names mappings for header card
  const roleDisplayNames = {
    admin: 'Admin',
    ops_head: 'Operations Head',
    hr: 'HR Lead',
    team_lead: 'Team Lead',
    bda: 'BDA'
  };

  const roleColors = {
    admin: 'var(--danger)',
    ops_head: 'var(--accent-blue)',
    hr: 'var(--purple)',
    team_lead: 'var(--warning)',
    bda: 'var(--success)'
  };

  const roleAvatar = currentRole.slice(0, 2).toUpperCase();

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-title-wrapper">
          <h1 id="header-page-title">{pageInfo.title}</h1>
          <p id="header-page-subtitle">{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="header-right">
        {/* Date Filter (Visible in Dashboard & KPI/Reports) */}
        {['dashboard', 'kpi-board', 'reports'].includes(activePage) && (
          <div className="header-date-filter" id="header-date-filter">
            {['Today', '7 Days', '30 Days'].map(days => (
              <button
                key={days}
                className={dateFilter === days ? 'active' : ''}
                onClick={() => setDateFilter(days)}
              >
                {days}
              </button>
            ))}
          </div>
        )}

        {/* Complaint Button (Only for BDA role) */}
        {currentRole === 'bda' && (
          <button 
            className="btn btn-primary" 
            id="bda-file-complaint-btn"
            onClick={onOpenComplaintModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--danger)', border: 'none' }}
          >
            <AlertCircle size={16} />
            File Complaint
          </button>
        )}

        {/* User Card */}
        <div className="header-profile-card">
          <div 
            className="header-avatar" 
            id="header-profile-avatar"
            style={{ backgroundColor: roleColors[currentRole] || 'var(--accent-blue)' }}
          >
            {roleAvatar}
          </div>
          <div className="profile-info">
            <span className="profile-name" id="header-profile-name">{user.name}</span>
            <span className="profile-role" id="header-profile-role">{roleDisplayNames[currentRole]}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
