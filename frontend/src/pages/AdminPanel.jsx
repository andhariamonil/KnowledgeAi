import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';

const ROLE_CONFIG = {
  admin:   { color: 'var(--rose)',    icon: '👑', bg: 'rgba(244,63,94,0.12)',    border: 'rgba(244,63,94,0.2)' },
  mentor:  { color: 'var(--violet)', icon: '🎓', bg: 'rgba(139,92,246,0.12)',   border: 'rgba(139,92,246,0.2)' },
  trainee: { color: 'var(--cyan)',   icon: '🌱', bg: 'rgba(34,211,238,0.12)',   border: 'rgba(34,211,238,0.2)' },
};

function StatCard({ icon, value, label, color, delay }) {
  return (
    <div className="stat-card animate-fade-up" style={{ animationDelay: delay }}>
      <div className="stat-icon-wrap" style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div className="stat-value" style={{ background: `linear-gradient(135deg, ${color}, white)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function AdminPanel() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    usersAPI.list().then((data) => { setUsers(data); setLoading(false); }).catch(() => {
      // Fallback mock data while backend is being wired
      setUsers(MOCK_USERS); setLoading(false);
    });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`Role updated to ${newRole}`);
    } catch {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`Role updated to ${newRole} (mock)`);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user permanently?')) return;
    try { await usersAPI.delete(userId); } catch {}
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast('User removed');
  };

  const filtered = users.filter((u) => {
    const matchesRole = filter === 'all' || u.role === filter;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const counts = { total: users.length, admin: users.filter(u => u.role === 'admin').length, mentor: users.filter(u => u.role === 'mentor').length, trainee: users.filter(u => u.role === 'trainee').length };

  return (
    <div className="page-container">
      <div className="animate-fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Admin <span className="gradient-text">Panel</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Manage users, roles, and workspace access.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard icon="👥" value={counts.total}   label="Total Users"   color="var(--indigo)" delay="0ms" />
        <StatCard icon="👑" value={counts.admin}   label="Admins"        color="var(--rose)"   delay="80ms" />
        <StatCard icon="🎓" value={counts.mentor}  label="Mentors"       color="var(--violet)" delay="160ms" />
        <StatCard icon="🌱" value={counts.trainee} label="Trainees"      color="var(--cyan)"   delay="240ms" />
      </div>

      {/* Table Card */}
      <div className="animate-fade-up delay-300" style={{
        borderRadius: 'var(--radius-lg)', background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', overflow: 'hidden',
      }}>
        <div className="card-header" style={{ padding: '20px 24px', flexWrap: 'wrap', gap: 12 }}>
          <div className="card-title">User Management</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Search */}
            <input
              className="form-input"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200, margin: 0, padding: '6px 12px' }}
            />
            {/* Role filter */}
            {['all', 'admin', 'mentor', 'trainee'].map((r) => (
              <button key={r} className={`filter-chip ${filter === r ? 'active' : ''}`}
                onClick={() => setFilter(r)} style={{ textTransform: 'capitalize' }}>
                {r === 'all' ? 'All Roles' : `${ROLE_CONFIG[r]?.icon} ${r}`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, display: 'inline-block' }} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {['User', 'Email', 'Role', 'Workspace', 'Joined', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.trainee;
                  return (
                    <tr key={u.id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      animation: `fadeInUp 300ms ${i * 50}ms both`,
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${rc.color}, var(--indigo))`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                          }}>
                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{
                            padding: '5px 10px', borderRadius: 'var(--radius-full)',
                            background: rc.bg, border: `1px solid ${rc.border}`,
                            color: rc.color, fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                          }}
                        >
                          <option value="admin">👑 Admin</option>
                          <option value="mentor">🎓 Mentor</option>
                          <option value="trainee">🌱 Trainee</option>
                        </select>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{u.workspace || '—'}</td>
                      <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => handleDelete(u.id)}
                          style={{
                            padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
                            color: 'var(--rose)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          🗑 Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                No users match your filters.
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="toast-container">
          <div className="toast">
            <span>✅</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const MOCK_USERS = [
  { id: 'u1', name: 'Alice Johnson',  email: 'alice@acme.com',   role: 'admin',   workspace: 'Acme Corp',   createdAt: '2024-09-01' },
  { id: 'u2', name: 'Bob Smith',      email: 'bob@acme.com',     role: 'mentor',  workspace: 'Acme Corp',   createdAt: '2024-09-15' },
  { id: 'u3', name: 'Carol Davis',    email: 'carol@acme.com',   role: 'trainee', workspace: 'Acme Corp',   createdAt: '2024-10-01' },
  { id: 'u4', name: 'David Kim',      email: 'david@acme.com',   role: 'trainee', workspace: 'Acme Corp',   createdAt: '2024-10-10' },
  { id: 'u5', name: 'Eva Martinez',   email: 'eva@acme.com',     role: 'mentor',  workspace: 'Acme Corp',   createdAt: '2024-10-20' },
  { id: 'u6', name: 'Frank Lee',      email: 'frank@acme.com',   role: 'trainee', workspace: 'Acme Corp',   createdAt: '2024-11-01' },
];