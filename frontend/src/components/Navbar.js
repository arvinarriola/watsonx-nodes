import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (to) =>
    to === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(to);

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isActive(to)
          ? 'bg-white/10 text-white'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav style={{ background: 'linear-gradient(90deg, #0f1117 0%, #1a1d27 100%)', borderBottom: '1px solid #2a2d3a' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div style={{ background: 'linear-gradient(135deg, #4f7ef8, #7c5cfc)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="3" fill="white" opacity="0.9"/>
              <circle cx="7" cy="2" r="1.5" fill="white" opacity="0.5"/>
              <circle cx="7" cy="12" r="1.5" fill="white" opacity="0.5"/>
              <circle cx="2" cy="7" r="1.5" fill="white" opacity="0.5"/>
              <circle cx="12" cy="7" r="1.5" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-tight">
            WatsonX <span style={{ color: '#4f7ef8' }}>Nodes</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/discover', 'Discover')}
          {navLink('/nodes/new', '+ Node')}
          {navLink('/profile', 'Profile')}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-2 text-xs text-white/50">
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #4f7ef8, #7c5cfc)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
              {user?.name?.[0]?.toUpperCase()}
            </span>
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{ background: '#2a2d3a', color: '#7a7f9a', border: '1px solid #3a3d4a' }}
            onMouseEnter={e => { e.target.style.color = '#e8eaf0'; e.target.style.borderColor = '#4f7ef8'; }}
            onMouseLeave={e => { e.target.style.color = '#7a7f9a'; e.target.style.borderColor = '#3a3d4a'; }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
