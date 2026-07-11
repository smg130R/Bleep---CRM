import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Eye, EyeOff, Key, Shield, ShieldCheck, Users, Target, UserCheck, ChevronDown, Check, Loader } from 'lucide-react';

const roleOptions = {
  admin: [
    { value: 'admin', label: 'Administrator', icon: ShieldCheck },
    { value: 'ops_head', label: 'Operations Head', icon: Shield },
    { value: 'hr', label: 'HR Department', icon: Users },
    { value: 'team_lead', label: 'Team Lead', icon: Target },
    { value: 'bda', label: 'Business Development Associate', icon: UserCheck }
  ],
  hr: [
    { value: 'team_lead', label: 'Team Lead', icon: Target },
    { value: 'bda', label: 'Business Development Associate', icon: UserCheck }
  ],
  ops_head: [
    { value: 'team_lead', label: 'Team Lead', icon: Target },
    { value: 'bda', label: 'Business Development Associate', icon: UserCheck }
  ],
  team_lead: [
    { value: 'bda', label: 'Business Development Associate', icon: UserCheck }
  ]
};

const getPasswordStrength = (pw) => {
  if (!pw) return { label: '', score: 0, color: '#E5E7EB', bars: 0 };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', score, color: '#DC2626', bars: 1 };
  if (score <= 3) return { label: 'Medium', score, color: '#F59E0B', bars: 3 };
  return { label: 'Strong', score, color: '#16A34A', bars: 5 };
};

const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let pw = '';
  for (let i = 0; i < 14; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
};

const inputStyles = {
  height: 48,
  borderRadius: 12,
  padding: '0 16px',
  fontSize: 15,
  border: '1.5px solid #D9DEE7',
  outline: 'none',
  width: '100%',
  transition: 'all 200ms ease',
  background: '#FFFFFF',
  color: '#111827',
  fontFamily: 'inherit',
};

const inputFocusStyles = {
  borderColor: '#2563EB',
  boxShadow: '0 0 0 3px rgba(37,99,235,0.12)',
};

const labelStyles = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

const sectionHeadingStyles = {
  fontSize: 12,
  fontWeight: 700,
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: 16,
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
  const [showPassword, setShowPassword] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const nameRef = useRef(null);
  const roleRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setRole(allowedRoles[0]?.value || 'bda');
      setEmployeeCode('');
      setTeamId('');
      setTeamName('');
      setShowPassword(false);
      setRoleOpen(false);
      setLoading(false);
      setErrors({});
      setTouched({});
      setTimeout(() => nameRef.current?.focus(), 100);
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

  useEffect(() => {
    if (!roleOpen) return;
    const handler = (e) => { if (roleRef.current && !roleRef.current.contains(e.target)) setRoleOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [roleOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    return errs;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({ name: true, email: true, password: true });
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    const payload = { name, email, password, role, employeeCode };
    if (role === 'team_lead') payload.teamName = teamName.trim() || null;
    else payload.teamId = teamId || null;
    try {
      await onSave(payload);
      setTimeout(() => onClose(), 800);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);
  const selectedRole = allowedRoles.find(r => r.value === role);

  return (
    <div
      className="modal-overlay show"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15,23,42,0.45)' }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(15,23,42,0.15)',
          width: 'calc(100% - 32px)',
          maxWidth: 660,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateY(0)',
          opacity: 1,
          animation: 'modalEnter 220ms ease-out',
        }}
      >
        <style>{`
          @keyframes modalEnter { from { opacity:0; transform:scale(0.96) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
          @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
          .add-emp-input:focus { border-color:#2563EB !important; box-shadow:0 0 0 3px rgba(37,99,235,0.12) !important; }
          .add-emp-input.error { border-color:#DC2626 !important; box-shadow:0 0 0 3px rgba(220,38,38,0.10) !important; }
          .add-emp-input.error:focus { border-color:#DC2626 !important; box-shadow:0 0 0 3px rgba(220,38,38,0.15) !important; }
          .add-emp-option:hover { background:#F8FAFC; }
          .add-emp-option[data-selected="true"] { background:#EFF6FF; color:#2563EB; }
        `}</style>

        {/* Header */}
        <div style={{ padding: '28px 32px 0 32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
              Add New Employee
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0 0', fontWeight: 500 }}>
              Create a new employee account and assign their organization role.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 40, height: 40, borderRadius: 20, border: 'none',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              color: '#9CA3AF', transition: 'all 150ms ease', marginTop: 2,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#F0F0F5', margin: '20px 32px 0 32px' }} />

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px 32px 28px 32px' }}>
          {/* Section 1 */}
          <div style={{ marginBottom: 28 }}>
            <div style={sectionHeadingStyles}>Employee Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Full Name */}
              <div>
                <label htmlFor="emp-name" style={labelStyles}>
                  Full Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input
                    ref={nameRef}
                    id="emp-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (touched.name) setErrors(validate()); }}
                    onBlur={() => handleBlur('name')}
                    className={`add-emp-input${errors.name && touched.name ? ' error' : ''}`}
                    style={{ ...inputStyles, paddingLeft: 42 }}
                    aria-required="true"
                    aria-invalid={!!(errors.name && touched.name)}
                  />
                </div>
                {errors.name && touched.name && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#DC2626', animation: 'fadeSlideIn 180ms ease-out' }}>{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="emp-email" style={labelStyles}>
                  Email Address <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input
                    id="emp-email"
                    type="email"
                    placeholder="john@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors(validate()); }}
                    onBlur={() => handleBlur('email')}
                    className={`add-emp-input${errors.email && touched.email ? ' error' : ''}`}
                    style={{ ...inputStyles, paddingLeft: 42 }}
                    aria-required="true"
                    aria-invalid={!!(errors.email && touched.email)}
                  />
                </div>
                {errors.email && touched.email && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#DC2626', animation: 'fadeSlideIn 180ms ease-out' }}>{errors.email}</p>
                )}
              </div>

              {/* Employee ID */}
              <div>
                <label style={labelStyles}>Employee ID</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ ...inputStyles, display: 'flex', alignItems: 'center', background: '#F9FAFB', cursor: 'default' }}>
                    <span style={{ fontSize: 15, color: '#111827', fontWeight: 600 }}>{employeeCode || '—'}</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>Automatically generated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div style={{ marginBottom: 24 }}>
            <div style={sectionHeadingStyles}>Account Access</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Password */}
              <div>
                <label htmlFor="emp-password" style={labelStyles}>
                  Login Password <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none', zIndex: 1 }} />
                  <input
                    id="emp-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors(validate()); }}
                    onBlur={() => handleBlur('password')}
                    className={`add-emp-input${errors.password && touched.password ? ' error' : ''}`}
                    style={{ ...inputStyles, paddingLeft: 42, paddingRight: 100 }}
                    aria-required="true"
                    aria-invalid={!!(errors.password && touched.password)}
                  />
                  <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4, zIndex: 1 }}>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', transition: 'all 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { const p = generatePassword(); setPassword(p); if (touched.password) setErrors(validate()); }}
                      aria-label="Generate password"
                      style={{ padding: '0 10px', height: 32, borderRadius: 8, border: '1px solid #D9DEE7', background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', transition: 'all 150ms', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#C5CBD6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D9DEE7'; }}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                {password && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ width: 32, height: 4, borderRadius: 2, background: i <= strength.bars ? strength.color : '#E5E7EB', transition: 'all 200ms' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 13, color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                  </div>
                )}
                {errors.password && touched.password && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#DC2626', animation: 'fadeSlideIn 180ms ease-out' }}>{errors.password}</p>
                )}
              </div>

              {/* Role */}
              <div ref={roleRef} style={{ position: 'relative' }}>
                <label htmlFor="emp-role" style={labelStyles}>
                  Organization Role <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <button
                  type="button"
                  id="emp-role"
                  onClick={() => setRoleOpen(!roleOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={roleOpen}
                  style={{
                    ...inputStyles, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', background: '#FFFFFF', textAlign: 'left',
                    borderColor: roleOpen ? '#2563EB' : '#D9DEE7',
                    boxShadow: roleOpen ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {selectedRole && <selectedRole.icon size={18} style={{ color: '#6B7280', flexShrink: 0 }} />}
                    <span style={{ color: '#111827', fontSize: 15, fontWeight: 500 }}>{selectedRole?.label}</span>
                  </span>
                  <ChevronDown size={16} style={{ color: '#9CA3AF', transition: 'transform 200ms', transform: roleOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>
                {roleOpen && (
                  <div
                    role="listbox"
                    style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                      background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 12,
                      boxShadow: '0 12px 32px rgba(15,23,42,0.12)', zIndex: 50, overflow: 'hidden',
                      animation: 'fadeSlideIn 150ms ease-out',
                    }}
                  >
                    {allowedRoles.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        role="option"
                        aria-selected={role === r.value}
                        data-selected={role === r.value}
                        className="add-emp-option"
                        onClick={() => { setRole(r.value); setRoleOpen(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 16px', border: 'none', background: role === r.value ? '#EFF6FF' : 'transparent',
                          cursor: 'pointer', fontSize: 14, color: role === r.value ? '#2563EB' : '#374151',
                          fontWeight: role === r.value ? 600 : 500, textAlign: 'left', transition: 'all 100ms',
                        }}
                      >
                        {<r.icon size={18} style={{ color: role === r.value ? '#2563EB' : '#6B7280', flexShrink: 0 }} />}
                        <span style={{ flex: 1 }}>{r.label}</span>
                        {role === r.value && <Check size={16} style={{ color: '#2563EB' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Team / Team Name */}
              {role === 'team_lead' && (
                <div>
                  <label htmlFor="emp-team-name" style={labelStyles}>Team Name</label>
                  <input
                    id="emp-team-name"
                    type="text"
                    placeholder="e.g. Alpha Team"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="add-emp-input"
                    style={inputStyles}
                  />
                </div>
              )}
              {(role === 'bda' || role === 'team_lead') && role !== 'team_lead' && (
                <div>
                  <label htmlFor="emp-team" style={labelStyles}>Assigned Division / Team</label>
                  <div style={{ position: 'relative' }}>
                    <Shield size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none', zIndex: 1 }} />
                    <select
                      id="emp-team"
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      style={{ ...inputStyles, paddingLeft: 42, appearance: 'none', backgroundImage: 'none', cursor: 'pointer' }}
                      className="add-emp-input"
                    >
                      <option value="">None / Management</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 20, borderTop: '1px solid #F0F0F5', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                height: 48, borderRadius: 12, padding: '0 24px',
                border: '1.5px solid #D9DEE7', background: '#FFFFFF',
                color: '#374151', fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease', opacity: loading ? 0.6 : 1,
                minWidth: 120,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#C5CBD6'; }}}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D9DEE7'; }}}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                height: 48, borderRadius: 12, padding: '0 24px',
                border: 'none', background: loading ? '#93B4F5' : '#2563EB',
                color: '#FFFFFF', fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease', opacity: loading ? 0.8 : 1,
                minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1D4ED8'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2563EB'; }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? <Loader size={16} style={{ animation: 'spin 600ms linear infinite' }} /> : null}
              {loading ? 'Creating Employee...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;