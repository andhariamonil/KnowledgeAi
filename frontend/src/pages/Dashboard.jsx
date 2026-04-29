import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI } from '../services/api';

const STAT_CARDS = [
  {
    key: 'totalDocuments',
    label: 'Total Documents',
    icon: '📄',
    iconBg: 'rgba(99,102,241,0.15)',
    iconBorder: 'rgba(99,102,241,0.25)',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
  },
  {
    key: 'totalQueries',
    label: 'Total Queries',
    icon: '💬',
    iconBg: 'rgba(139,92,246,0.15)',
    iconBorder: 'rgba(139,92,246,0.25)',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  },
  {
    key: 'activeUsers',
    label: 'Active Users',
    icon: '👥',
    iconBg: 'rgba(34,211,238,0.15)',
    iconBorder: 'rgba(34,211,238,0.25)',
    gradient: 'linear-gradient(135deg, #22d3ee, #67e8f9)',
  },
  {
    key: 'avgResponseTime',
    label: 'Avg Response Time',
    icon: '⚡',
    iconBg: 'rgba(16,185,129,0.15)',
    iconBorder: 'rgba(16,185,129,0.25)',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
  },
];

const SOURCE_LABELS = { pdf: 'PDF', doc: 'Doc', slack: 'Slack', email: 'Email' };

function greeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? '🌅 Good morning' : h < 18 ? '☀️ Good afternoon' : '🌙 Good evening';
  return `${time}, ${name?.split(' ')[0] || 'there'}!`;
}

export default function Dashboard() {
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    statsAPI.getDashboard()
      .then((data) => { setStats(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const role   = user?.role || 'trainee';
  const canUpload = role === 'admin' || role === 'mentor';

  return (
    <div className="page-container">

      {/* Header */}
      <div className="dashboard-header animate-fade-up">
        <div className="dashboard-greeting">{greeting(user?.name)}</div>
        <h1 className="dashboard-title">
          Your <span className="gradient-text">Knowledge Hub</span>
        </h1>
        <p className="dashboard-subtitle">
          {loading
            ? 'Loading workspace stats…'
            : error
            ? 'Could not load stats — backend may still be starting'
            : `${stats?.indexedDocuments ?? 0} documents indexed · Hybrid RAG active · ${stats?.totalQueries ?? 0} queries served`
          }
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '12px 16px', marginBottom: 24, borderRadius: 'var(--radius-md)',
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
          color: 'var(--rose)', fontSize: 13,
        }}>
          ⚠️ Stats error: {error}. The dashboard will still work — stats will load once the backend is fully ready.
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {STAT_CARDS.map((card, i) => (
          <div
            key={card.key}
            className="stat-card animate-fade-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div
              className="stat-icon-wrap"
              style={{ background: card.iconBg, border: `1px solid ${card.iconBorder}` }}
            >
              <span style={{ fontSize: 18 }}>{card.icon}</span>
            </div>

            <div
              className="stat-value"
              style={{
                background: card.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {loading ? '—' : (stats?.[card.key] ?? '0')}
            </div>

            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* Recent Queries */}
        <div className="recent-queries-card animate-fade-up delay-300">
          <div className="card-header">
            <div className="card-title">Recent Queries</div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/chat')}
              style={{ fontSize: 12, color: 'var(--indigo-light)' }}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <div className="spinner" style={{ width: 22, height: 22, borderWidth: 2, display: 'inline-block' }} />
            </div>
          ) : stats?.recentQueries?.length > 0 ? (
            stats.recentQueries.map((q, i) => (
              <div key={i} className="query-item" onClick={() => navigate(q.session_id ? `/chat/${q.session_id}` : '/chat')}>
                <div className="query-icon">💬</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="query-text">{q.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Fallback placeholder rows when no real queries yet */
            [
              'What is the employee onboarding process?',
              'Summarize the Q3 financial report',
              'What is the deployment procedure?',
              'How many vacation days do employees get?',
            ].map((text, i) => (
              <div key={i} className="query-item" onClick={() => navigate('/chat')}
                style={{ opacity: 0.5 }}>
                <div className="query-icon">💬</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="query-text">{text}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Example query — start chatting to see real history
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Quick Actions */}
          <div className="quick-actions-card animate-fade-up delay-400">
            <div className="card-header">
              <div className="card-title">Quick Actions</div>
            </div>

            {[
              {
                icon: '💬', bg: 'rgba(99,102,241,0.15)',
                label: 'Start New Chat', sub: 'Ask your knowledge base',
                action: () => navigate('/chat'),
                show: true,
              },
              {
                icon: '📤', bg: 'rgba(139,92,246,0.15)',
                label: 'Upload Document', sub: 'Add files to knowledge base',
                action: () => navigate('/documents'),
                show: canUpload,
              },
              {
                icon: '🔍', bg: 'rgba(34,211,238,0.15)',
                label: 'Browse Documents', sub: `${stats?.indexedDocuments ?? 0} indexed files`,
                action: () => navigate('/documents'),
                show: canUpload,
              },
              {
                icon: '👑', bg: 'rgba(244,63,94,0.15)',
                label: 'Manage Users', sub: 'Admin panel',
                action: () => navigate('/admin'),
                show: role === 'admin',
              },
            ].filter(item => item.show).map((item) => (
              <div key={item.label} className="action-btn" onClick={item.action}>
                <div className="action-btn-icon" style={{ background: item.bg }}>
                  {item.icon}
                </div>
                <div>
                  <div className="action-btn-label">{item.label}</div>
                  <div className="action-btn-sub">{item.sub}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 16 }}>›</span>
              </div>
            ))}
          </div>

          {/* System Status */}
          <div
            className="animate-fade-up delay-500"
            style={{
              padding: 20, borderRadius: 'var(--radius-lg)',
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="card-title" style={{ marginBottom: 14 }}>System Status</div>

            {[
              { label: 'PostgreSQL + pgvector', status: !error ? 'Operational' : 'Check connection', color: !error ? 'var(--emerald)' : 'var(--amber)' },
              { label: 'Local Embeddings',      status: 'Operational', color: 'var(--emerald)' },
              { label: 'LLM API (Groq)',        status: 'Operational', color: 'var(--emerald)' },
              { label: 'Hybrid RAG Index',      status: !error ? 'Operational' : 'Pending', color: !error ? 'var(--emerald)' : 'var(--amber)' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 10,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: item.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                  {item.status}
                </span>
              </div>
            ))}

            <div style={{
              marginTop: 14, padding: '8px 12px', borderRadius: 'var(--radius-md)',
              background: error ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
              border: error ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(16,185,129,0.15)',
              fontSize: 12, color: error ? 'var(--amber)' : 'var(--emerald)',
              textAlign: 'center',
            }}>
              {error ? '⚠️ Check backend connection' : '✓ All systems operational'}
            </div>
          </div>

          {/* Workspace info */}
          <div className="animate-fade-up delay-500" style={{
            padding: '16px 20px', borderRadius: 'var(--radius-lg)',
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Your Workspace
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.workspace || 'Default Workspace'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {stats?.totalChunks ?? 0} total chunks indexed in pgvector
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}