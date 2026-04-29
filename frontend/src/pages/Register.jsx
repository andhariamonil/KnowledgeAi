import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ROLES = [
  { value: 'trainee', icon: '🌱', label: 'Trainee', desc: 'Learn and query knowledge base' },
  { value: 'mentor',  icon: '🎓', label: 'Mentor',  desc: 'Upload docs, guide trainees' },
  { value: 'admin',   icon: '👑', label: 'Admin',   desc: 'Full platform access & user management' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'trainee', workspace: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password, role: form.role, workspace: form.workspace });
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
        <div className="login-logo">
          <div className="login-logo-icon">🧠</div>
          <div className="login-title gradient-text">Create Account</div>
          <div className="login-sub">Join your organization's knowledge workspace</div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role picker */}
          <div style={{ marginBottom: 20 }}>
            <div className="form-label" style={{ marginBottom: 10 }}>I am a…</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {ROLES.map((r) => (
                <button
                  type="button" key={r.value}
                  onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 'var(--radius-md)',
                    background: form.role === r.value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.role === r.value ? 'rgba(99,102,241,0.5)' : 'var(--glass-border)'}`,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{r.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: form.role === r.value ? 'var(--indigo-light)' : 'var(--text-primary)' }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="Alex Johnson" required style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Organization</label>
              <input className="form-input" value={form.workspace} onChange={set('workspace')} placeholder="Acme Corp" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Email address *</label>
            <input type="email" className="form-input" value={form.email} onChange={set('email')} placeholder="you@company.com" required style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password *</label>
              <input type="password" className="form-input" value={form.password} onChange={set('password')} placeholder="Min 6 chars" required style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm Password *</label>
              <input type="password" className="form-input" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required style={{ width: '100%' }} />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
              color: 'var(--rose)', fontSize: 13,
            }}>{error}</div>
          )}

          <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: 16 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span className="spinner" /> Creating account…</span>
              : `Create ${ROLES.find(r => r.value === form.role)?.label} Account`}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--indigo-light)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}