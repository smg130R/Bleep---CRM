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
    <div style={{
      height: '100vh', width: '100vw', fontFamily: 'Inter, sans-serif',
      background: `linear-gradient(135deg, rgba(13,69,178,0.88) 0%, rgba(10,45,120,0.94) 100%), url(/banner.jpg) center/cover no-repeat`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 40%, rgba(255,255,255,0.07) 0%, transparent 60%)' }} />

      {/* Floating login card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px',
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        boxShadow: '0 16px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.18)',
      }}>
        {/* Logo + brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.jpg" alt="Bleep CRM" style={{ width: '64px', height: '64px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', objectFit: 'cover' }} />
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, margin: '0.75rem 0 0.2rem' }}>Bleep CRM</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0 }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', padding: '0.7rem 1rem', fontSize: '0.85rem', marginBottom: '1.25rem',
            backdropFilter: 'blur(4px)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', fontWeight: 500, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.3rem', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Email</label>
            <input
              type="email" id="email" placeholder="name@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{
                width: '100%', padding: '0.8rem 1rem', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.08)', color: '#fff',
                transition: 'border-color 0.2s, background 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ display: 'block', fontWeight: 500, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.3rem', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Password</label>
            <input
              type="password" id="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{
                width: '100%', padding: '0.8rem 1rem', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.08)', color: '#fff',
                transition: 'border-color 0.2s, background 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
            />
          </div>

          <button type="submit" style={{
            width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 0.2s, transform 0.15s',
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}
            onMouseOver={e => e.target.style.opacity = '0.9'}
            onMouseOut={e => e.target.style.opacity = '1'}
            onMouseDown={e => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.target.style.transform = 'scale(1)'}
          >
            Sign In
          </button>
        </form>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center',
          marginTop: '1.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)',
        }}>
          <Info size={13} />
          <span>Contact your administrator for credentials.</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '1.5rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
        &copy; {new Date().getFullYear()} Bleep CRM. All rights reserved.
      </div>
    </div>
  );
};

export default Login;
