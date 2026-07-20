import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const toEmail = (userId) => `${userId.trim().toLowerCase()}@watsonxnodes.app`;

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]     = useState({ userId: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId.trim()) return toast.error('User ID is required');
    setLoading(true);
    try {
      await login(toEmail(form.userId), form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#0f1117',
    border: '1px solid #2a2d3a',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    color: '#e8eaf0',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117', padding: '0 16px' }}>

      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,126,248,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #4f7ef8, #7c5cfc)', marginBottom: 16, boxShadow: '0 0 32px rgba(79,126,248,0.3)' }}>
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="3" fill="white" opacity="0.9"/>
              <circle cx="7" cy="2" r="1.5" fill="white" opacity="0.5"/>
              <circle cx="7" cy="12" r="1.5" fill="white" opacity="0.5"/>
              <circle cx="2" cy="7" r="1.5" fill="white" opacity="0.5"/>
              <circle cx="12" cy="7" r="1.5" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaf0', margin: 0 }}>WatsonX Nodes</h1>
          <p style={{ fontSize: 13, color: '#7a7f9a', marginTop: 4 }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 18, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7a7f9a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                User ID
              </label>
              <input
                type="text" required autoFocus
                value={form.userId}
                onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}
                placeholder="e.g. user001"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#4f7ef8'}
                onBlur={e => e.target.style.borderColor = '#2a2d3a'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7a7f9a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password
              </label>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#4f7ef8'}
                onBlur={e => e.target.style.borderColor = '#2a2d3a'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#2a2d3a' : 'linear-gradient(135deg, #4f7ef8, #7c5cfc)',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                padding: '11px 0',
                borderRadius: 10,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
                marginTop: 4,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(79,126,248,0.3)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#7a7f9a', margin: 0 }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#4f7ef8', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
