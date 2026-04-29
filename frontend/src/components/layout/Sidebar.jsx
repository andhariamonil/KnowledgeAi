import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV_BY_ROLE = {
  admin: [
    { path: '/dashboard', icon: '⊞',  label: 'Dashboard' },
    { path: '/chat',      icon: '💬', label: 'AI Assistant', badge: null },
    { path: '/documents', icon: '📄', label: 'Documents' },
    { path: '/admin',     icon: '👑', label: 'Admin Panel' },
  ],
  mentor: [
    { path: '/dashboard', icon: '⊞',  label: 'Dashboard' },
    { path: '/chat',      icon: '💬', label: 'AI Assistant' },
    { path: '/documents', icon: '📄', label: 'Documents' },
  ],
  trainee: [
    { path: '/dashboard', icon: '⊞',  label: 'Dashboard' },
    { path: '/chat',      icon: '💬', label: 'AI Assistant' },
    { path: '/documents', icon: '📄', label: 'Documents' },
  ],
};

const ROLE_CONFIG = {
  admin:   { color: 'var(--rose)',    icon: '👑', label: 'Admin' },
  mentor:  { color: 'var(--violet)', icon: '🎓', label: 'Mentor' },
  trainee: { color: 'var(--cyan)',   icon: '🌱', label: 'Trainee' },
};

const INTEGRATIONS = [
  { icon: '📧', label: 'Email',  status: 'connected' },
  { icon: '💼', label: 'Slack',  status: 'connected' },
  { icon: '📝', label: 'Notion', status: 'disconnected' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const role = user?.role || 'trainee';
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.trainee;
  const roleConf = ROLE_CONFIG[role] || ROLE_CONFIG.trainee;

  const initials = (user?.name || 'U')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🧠</div>
        <div>
          <div className="sidebar-logo-text">KnowledgeAI</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Internal Assistant</div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', margin: '0 0 10px 12px',
        borderRadius: 'var(--radius-full)',
        background: `${roleConf.color}18`,
        border: `1px solid ${roleConf.color}30`,
        fontSize: 11, fontWeight: 600, color: roleConf.color,
        alignSelf: 'flex-start',
      }}>
        {roleConf.icon} {roleConf.label}
      </div>

      {/* Main Nav */}
      <div className="sidebar-section-label">Navigation</div>
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            {isActive && <div className="active-indicator" />}
            <span className="nav-icon" style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Integrations (admin + mentor) */}
      {(role === 'admin' || role === 'mentor') && (
        <>
          <div className="sidebar-section-label" style={{ marginTop: 12 }}>Integrations</div>
          {INTEGRATIONS.map((item) => (
            <div key={item.label} className="sidebar-nav-item" style={{ cursor: 'pointer' }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: item.status === 'connected' ? 'var(--emerald)' : 'var(--text-muted)',
              }} />
            </div>
          ))}
        </>
      )}

      {/* Bottom */}
      <div className="sidebar-bottom">
        <Link to="/profile" className="sidebar-nav-item" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 16 }}>⚙️</span>
          <span>Profile & Settings</span>
        </Link>

        <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{roleConf.label} · Logout ↗</div>
          </div>
        </div>
      </div>
    </aside>
  );
}