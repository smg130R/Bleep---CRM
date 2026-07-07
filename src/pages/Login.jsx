import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Info } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.message || 'Login failed.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'Inter, sans-serif' }}>
      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        background: `linear-gradient(135deg, rgba(13,69,178,0.92) 0%, rgba(10,45,120,0.97) 100%), url(/banner.jpg) center/cover no-repeat`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <img src="/logo.jpg" alt="Bleep CRM" style={{ width: '96px', height: '96px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: '1.5rem', objectFit: 'cover' }} />
          <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>Bleep CRM</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', marginTop: '0.5rem', maxWidth: '400px' }}>
            Office management & KPI tracking platform
          </p>
          <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>KPI</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Performance Tracking</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>CRM</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Lead Management</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>BI</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Analytics</div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} Bleep CRM. All rights reserved.
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        background: '#f8fafc',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Welcome back</h2>
            <p style={{ color: '#64748b', marginTop: '0.3rem', fontSize: '0.95rem' }}>Sign in to your account</p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="email" style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.35rem' }}>Email Address</label>
              <input
                type="email" id="email" placeholder="name@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{
                  width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px',
                  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#0c45b2'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.35rem' }}>Password</label>
              <input
                type="password" id="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required
                style={{
                  width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px',
                  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#0c45b2'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <button type="submit" style={{
              width: '100%', padding: '0.8rem', background: 'linear-gradient(135deg, #0c45b2, #205FF0)',
              color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600,
              cursor: 'pointer', transition: 'opacity 0.2s',
            }}
              onMouseOver={e => e.target.style.opacity = '0.9'}
              onMouseOut={e => e.target.style.opacity = '1'}
            >
              Sign In
            </button>
          </form>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center',
            marginTop: '1.5rem', fontSize: '0.8rem', color: '#94a3b8',
          }}>
            <Info size={14} />
            <span>Contact your administrator for credentials.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
