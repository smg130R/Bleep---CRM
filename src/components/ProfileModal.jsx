import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Lock, User, Calendar, Phone, Mail, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfileModal = ({ isOpen, onClose, showToast }) => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [form, setForm] = useState({ name: '', phone: '', dob: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', dob: user.dob || '' });
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: form.name, phone: form.phone, dob: form.dob }),
      });
      if (res.ok) {
        showToast('Profile updated');
        onClose();
      } else {
        const d = await res.json();
        showToast(d.message || 'Failed to update', true);
      }
    } catch { showToast('Connection error', true); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) { showToast('Passwords do not match', true); return; }
    if (passwordForm.newPass.length < 6) { showToast('Password must be at least 6 characters', true); return; }
    setChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPass }),
      });
      if (res.ok) {
        showToast('Password changed');
        setPasswordForm({ current: '', newPass: '', confirm: '' });
      } else {
        const d = await res.json();
        showToast(d.message || 'Failed to change password', true);
      }
    } catch { showToast('Connection error', true); }
    finally { setChangingPass(false); }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Profile Settings</h2>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 6 }}><X size={18} /></button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.role}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-secondary" onClick={toggleTheme} style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'light' ? 'Dark' : 'Light'}
              </button>
            </div>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><User size={16} /> Personal Info</h3>
          <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Full Name</label>
              <input className="table-input" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.75rem' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email</label>
              <input className="table-input" type="email" value={form.email} disabled style={{ width: '100%', padding: '0.6rem 0.75rem', opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Phone</label>
                <input className="table-input" type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.75rem' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date of Birth</label>
                <input className="table-input" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.75rem' }} />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={16} /> Change Password</h3>
          <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Current Password</label>
              <input className="table-input" type="password" value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.75rem' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>New Password</label>
                <input className="table-input" type="password" value={passwordForm.newPass} onChange={e => setPasswordForm({ ...passwordForm, newPass: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.75rem' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Confirm New Password</label>
                <input className="table-input" type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.75rem' }} />
              </div>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={changePassword} disabled={changingPass} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            <Lock size={16} /> {changingPass ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Joined: {user?.joinedDate?.split('T')[0] || 'N/A'}</div>
          <button className="btn btn-danger" onClick={logout} style={{ padding: '0.4rem 1rem', fontSize: 13 }}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;