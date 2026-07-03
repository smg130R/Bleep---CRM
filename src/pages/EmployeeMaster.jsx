import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Search, Mail, Phone, Calendar, UserCheck } from 'lucide-react';
import AddEmployeeModal from '../components/AddEmployeeModal';

const EmployeeMaster = ({ showToast }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [teamLeads, setTeamLeads] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
              </tr>
            </thead>
            <tbody id="employee-master-tbody">
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No employee profiles matched.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>EMP-{String(emp.id).padStart(3, '0')}</td>
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
    </div>
  );
};

export default EmployeeMaster;
