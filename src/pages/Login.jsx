import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck2, Info } from 'lucide-react';

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
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-section" style={{ flex: 1, maxWidth: '440px', margin: '0 auto' }}>
          <div className="brand-wrapper" style={{ marginBottom: '1.5rem' }}>
            <div className="brand-icon">
              <UserCheck2 size={24} />
            </div>
            <span className="brand-name">Bleep CRM</span>
          </div>

          <div className="login-form">
            <h2>Welcome back</h2>
            <p>Sign in to your office management & KPI portal.</p>

            {error && (
              <div className="auth-badge" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1rem', marginTop: '0' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-btn">
                Sign In
              </button>
            </form>

            <div className="auth-badge">
              <Info size={14} />
              <span>Contact your administrator for credentials.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
