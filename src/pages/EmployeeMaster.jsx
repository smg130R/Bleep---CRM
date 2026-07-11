import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Search, Mail, Phone, Calendar, UserCheck, Trash2, AlertTriangle, X, Loader } from 'lucide-react';
import AddEmployeeModal from '../components/AddEmployeeModal';

const EmployeeMaster = ({ showToast }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [teamLeads, setTeamLeads] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error('Error fetching Employee list:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeads = async () => {
    try {
      const res = await fetch('/api/employees/teams');
      if (res.ok) {
        const data = await res.json();
        const leadMap = {};
        (data.teams || []).forEach(t => { leadMap[t.id] = t.leadName; });
        setTeamLeads(leadMap);
      }
    } catch (err) {
      console.error('Error fetching team leads:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTeamLeads();
  }, []);

  const handleRemoveEmployee = async () => {
    if (!removing) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/employees/${removing.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        setRemoving(null);
        fetchEmployees();
      } else {
        showToast(data.message || 'Error removing employee', true);
      }
    } catch (err) {
      showToast('Connection to backend failed.', true);
    }
    finally { setRemoveLoading(false); }
  };

  const handleAddEmployee = async (newEmpData) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmpData)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Successfully created profile for ${newEmpData.name}!`);
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        showToast(data.message || 'Error creating profile', true);
      }
    } catch (err) {
      showToast('Connection to backend failed.', true);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    return emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="view-section active" id="employee-master-view">
      <div className="table-controls-panel">
        <div className="search-wrapper">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search directory by name, email or role..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-primary" 
          id="open-add-emp-modal-btn"
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <UserPlus size={16} />
          Add Employee Profile
        </button>
      </div>

      <div className="content-card" style={{ marginTop: '1.5rem', padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Details</th>
                <th>Designation Role</th>
                <th>Email ID</th>
                <th>Phone Number</th>
                <th>Assigned Lead</th>
                <th>Division / Team</th>
                <th>Joined Date</th>
                <th>Access Credentials</th>
                <th>Status</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody id="employee-master-tbody">
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No employee profiles matched.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{emp.employeeCode || ('EMP-' + String(emp.id).padStart(3, '0'))}</td>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-user-avatar">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="table-user-meta">
                          <span className="table-user-title">{emp.name}</span>
                          <span className="table-user-subtitle">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{emp.role.toUpperCase().replace('_', ' ')}</td>
                    <td>{emp.email}</td>
                    <td>{emp.phone || '—'}</td>
                    <td>{emp.role === 'bda' ? (teamLeads[emp.teamId] || 'Unassigned') : 'None'}</td>
                    <td>{emp.teamId ? `Team ${emp.teamId}` : 'Management'}</td>
                    <td>{emp.joinedDate}</td>
                    <td>
                      <span className="badge good">
                        {emp.role === 'admin' ? 'Full Control' : emp.role === 'ops_head' ? 'All Ops Metrics' : emp.role === 'hr' ? 'HR Hub' : emp.role === 'team_lead' ? 'Team KPI' : 'Personal Sheet'}
                      </span>
                    </td>
                    <td><span className="badge excellent">{emp.status || 'Active'}</span></td>
                    <td>
                      {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'ops_head' || (user?.role === 'team_lead' && emp.role === 'bda')) ? (
                        <button
                          onClick={() => setRemoving(emp)}
                          style={{
                            padding: '6px 10px', borderRadius: 8, border: '1px solid #FECACA',
                            background: '#FEF2F2', color: '#DC2626', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
                            transition: 'all 150ms',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddEmployee}
        currentRole={user?.role}
      />

      {/* Remove Confirmation Modal */}
      {removing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, maxWidth: 420, width: '90%',
            padding: '1.5rem', boxShadow: '0 20px 60px rgba(15,23,42,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Remove Employee</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>This action cannot be undone.</p>
              </div>
              <button onClick={() => setRemoving(null)} style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#374151', marginBottom: '1rem' }}>
              Are you sure you want to remove <strong>{removing.name}</strong> ({removing.employeeCode || 'EMP-' + String(removing.id).padStart(3, '0')})?
            </p>
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
              Their assigned leads and prospects will be unassigned and returned to the pool. Calling sheet data will be removed.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setRemoving(null)} disabled={removeLoading} style={{
                height: 42, borderRadius: 10, padding: '0 20px', border: '1.5px solid #D9DEE7',
                background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: removeLoading ? 'not-allowed' : 'pointer', opacity: removeLoading ? 0.6 : 1,
              }}>Cancel</button>
              <button onClick={handleRemoveEmployee} disabled={removeLoading} style={{
                height: 42, borderRadius: 10, padding: '0 20px', border: 'none',
                background: removeLoading ? '#FCA5A5' : '#DC2626', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: removeLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                opacity: removeLoading ? 0.8 : 1,
              }}>
                {removeLoading && <Loader size={14} style={{ animation: 'spin 600ms linear infinite' }} />}
                {removeLoading ? 'Removing...' : 'Remove Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeMaster;
