import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/chat':      'AI Assistant',
  '/documents': 'Documents',
  '/admin':     'Admin Panel',
  '/profile':   'Profile & Settings',
};

const ROLE_CONFIG = {
  admin:   { color: 'var(--rose)',    icon: '👑', label: 'Admin' },
  mentor:  { color: 'var(--violet)', icon: '🎓', label: 'Mentor' },
  trainee: { color: 'var(--cyan)',   icon: '🌱', label: 'Trainee' },
};

export default function Navbar() {
  const location = useNavigate ? useLocation() : { pathname: '/' };
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery]           = useState('');

  const role = user?.role || 'trainee';
  const rc   = ROLE_CONFIG[role] || ROLE_CONFIG.trainee;

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'KnowledgeAI';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/chat?q=${encodeURIComponent(query.trim())}`);
      setQuery(''); setSearchOpen(false);
    }
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="navbar-title">{pageTitle}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {user?.workspace || 'Workspace'}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>›</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{pageTitle}</span>
        </div>
      </div>

      <div className="navbar-actions">
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your docs…"
              style={{
                padding: '7px 14px', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: 'var(--text-primary)', fontFamily: 'inherit',
                fontSize: 13, outline: 'none', width: 280,
              }}
              onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
            />
            <button type="submit" className="navbar-icon-btn"
              style={{ background: 'rgba(99,102,241,0.2)' }}>↵</button>
          </form>
        ) : (
          <button className="navbar-icon-btn" onClick={() => setSearchOpen(true)}
            title="Global search (⌘K)">🔍</button>
        )}

        {/* Role badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 'var(--radius-full)',
          background: `${rc.color}18`, border: `1px solid ${rc.color}28`,
          fontSize: 12, fontWeight: 600, color: rc.color,
        }}>
          {rc.icon} {rc.label}
        </div>

        <div className="status-badge">
          <div className="status-dot" />
          RAG Active
        </div>

        <button className="navbar-icon-btn" title="Notifications">🔔</button>

        {(role === 'admin' || role === 'mentor') && (
          <button className="navbar-icon-btn"
            onClick={() => navigate('/documents')} title="Upload document">📤</button>
        )}
      </div>
    </header>
  );
}