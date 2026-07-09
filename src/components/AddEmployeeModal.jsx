import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const roleOptions = {
  admin: [{ value: 'admin', label: 'Admin' }, { value: 'ops_head', label: 'Operations Head' }, { value: 'hr', label: 'HR Department' }, { value: 'team_lead', label: 'Team Lead' }, { value: 'bda', label: 'Business Development Associate (BDA)' }],
  hr: [{ value: 'team_lead', label: 'Team Lead' }, { value: 'bda', label: 'Business Development Associate (BDA)' }],
  ops_head: [{ value: 'team_lead', label: 'Team Lead' }, { value: 'bda', label: 'Business Development Associate (BDA)' }],
  team_lead: [{ value: 'bda', label: 'Business Development Associate (BDA)' }]
};

const AddEmployeeModal = ({ isOpen, onClose, onSave, currentRole }) => {
  const allowedRoles = roleOptions[currentRole] || roleOptions.admin;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(allowedRoles[0]?.value || 'bda');
  const [employeeCode, setEmployeeCode] = useState('');
  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/employees/teams', { credentials: 'include' })
        .then(r => r.ok ? r.json() : { teams: [] })
        .then(d => setTeams(d.teams || []))
        .catch(() => setTeams([]));
      fetch('/api/employees/next-code')
        .then(r => r.ok ? r.json() : { nextCode: '' })
        .then(d => setEmployeeCode(d.nextCode || ''))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      alert('Name, email, password, and role are required.');
      return;
    }
    const payload = { name, email, password, role, employeeCode };
    if (role === 'team_lead') {
      payload.teamName = teamName.trim() || null;
    } else {
      payload.teamId = teamId || null;
    }
    onSave(payload);
    setName('');
    setEmail('');
    setPassword('');
    setRole(allowedRoles[0]?.value || 'bda');
    setEmployeeCode('');
    setTeamId('');
    setTeamName('');
  };

  return (
    <div className="modal-overlay show" id="add-employee-modal">
      <div className="modal-container" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Add New Employee Profile</h3>
          <button className="modal-close" id="modal-close-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label htmlFor="emp-name">Full Name</label>
                <input 
                  type="text" 
                  id="emp-name" 
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="emp-email">Email Address</label>
                <input 
                  type="email" 
                  id="emp-email" 
                  placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="emp-password">Login Password</label>
              <input 
                type="password" 
                id="emp-password" 
                placeholder="Set password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="emp-role">Organization Role</label>
              <select 
                id="emp-role" 
                className="table-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
              >
                {allowedRoles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="emp-code">Employee ID</label>
              <input 
                type="text" 
                id="emp-code" 
                placeholder="e.g. AD-001"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
              />
            </div>

            {role === 'team_lead' ? (
              <div className="input-group">
                <label htmlFor="emp-team-name">Team Name</label>
                <input
                  type="text"
                  id="emp-team-name"
                  placeholder="e.g. Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
            ) : role === 'bda' ? (
              <div className="input-group">
                <label htmlFor="emp-team">Assigned Division / Team</label>
                <select
                  id="emp-team"
                  className="table-select"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                >
                  <option value="">None / Management</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              id="modal-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              id="modal-save-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={14} />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
