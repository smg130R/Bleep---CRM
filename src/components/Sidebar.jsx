import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  TableProperties, 
  Network, 
  Users, 
  PhoneCall, 
  CalendarDays, 
  BarChart3, 
  ShieldAlert, 
  Settings, 
  LogOut,
  UserCheck2,
  ClipboardList,
  Target
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const currentRole = user.role;

  // Roles configuration matching prototype
  const roleMetadata = {
    admin: { name: user.name, title: 'System Administrator', color: 'var(--danger)', avatar: 'AD' },
    ops_head: { name: user.name, title: 'Operations Director', color: 'var(--accent-blue)', avatar: 'OP' },
    hr: { name: user.name, title: 'HR Lead Support', color: 'var(--purple)', avatar: 'HR' },
    team_lead: { name: user.name, title: user.teamId ? `Team ${user.teamId} Lead` : 'Team Lead', color: 'var(--warning)', avatar: 'TL' },
    bda: { name: user.name, title: 'Business Development Associate', color: 'var(--success)', avatar: 'BD' }
  };

  const currentMeta = roleMetadata[currentRole] || roleMetadata[user.role];

  // Page permissions
  const permissions = {
    admin: ['dashboard', 'kpi-board', 'team-structure', 'employee-master', 'reports', 'hr-desk', 'settings'],
    ops_head: ['dashboard', 'kpi-board', 'team-structure', 'follow-ups', 'reports', 'settings'],
    hr: ['dashboard', 'employee-master', 'hr-desk', 'settings'],
    team_lead: ['dashboard', 'kpi-board', 'team-structure', 'employee-master', 'prospects', 'follow-ups', 'reports', 'team-lead-workspace'],
    bda: ['dashboard', 'sales-calling', 'follow-ups', 'prospects']
  };

  const allowedPages = permissions[currentRole] || ['dashboard'];

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'kpi-board', name: 'KPI Board', icon: TableProperties },
    { id: 'team-structure', name: 'Team Structure', icon: Network },
    { id: 'team-lead-workspace', name: 'Lead Workspace', icon: ClipboardList },
    { id: 'employee-master', name: 'Employee Master', icon: Users },
    { id: 'sales-calling', name: 'Sales Calling', icon: PhoneCall },
    { id: 'prospects', name: 'Prospects', icon: Target },
    { id: 'follow-ups', name: 'Follow-ups', icon: CalendarDays },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    { id: 'hr-desk', name: 'HR Desk', icon: ShieldAlert },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <aside id="sidebar" className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <UserCheck2 size={20} />
          </div>
          <span className="brand-name white">Bleep CRM</span>
        </div>
      </div>

      <div className="sidebar-user-profile">
        <div 
          className="user-avatar" 
          id="sidebar-user-avatar"
          style={{ backgroundColor: currentMeta.color }}
        >
          {currentMeta.avatar}
        </div>
        <div className="user-info">
          <span className="user-name" id="sidebar-user-name">{currentMeta.name}</span>
          <span className="user-role-label" id="sidebar-role-title">{currentMeta.title}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const isAllowed = allowedPages.includes(item.id);
          if (!isAllowed) return null;
          const Icon = item.icon;

          return (
            <li key={item.id} className={`sidebar-menu-item ${activePage === item.id ? 'active' : ''}`}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActivePage(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </a>
            </li>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={logout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
