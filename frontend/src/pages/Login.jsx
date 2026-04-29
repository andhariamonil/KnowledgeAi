import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const ROLE_DEMO = [
  { role: 'admin',   email: 'admin@acme.com',   label: 'Admin',   color: 'var(--rose)',    icon: '👑' },
  { role: 'mentor',  email: 'mentor@acme.com',  label: 'Mentor',  color: 'var(--violet)',  icon: '🎓' },
  { role: 'trainee', email: 'trainee@acme.com', label: 'Trainee', color: 'var(--cyan)',    icon: '🌱' },
];

// ── Forgot Password Modal ─────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [step, setStep]         = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail]       = useState('');
  const [token, setToken]       = useState('');
  const [newPassword, setNew]   = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setInfo('');
    try {
      const res = await authAPI.forgotPassword(email);
      setInfo(res.message || 'Check your email for the reset link.');
      // Dev mode: backend returns the token directly
      if (res.resetToken) {
        setToken(res.resetToken);
        setInfo(`${res.message} (Dev mode — token pre-filled below)`);
      }
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.resetPassword(token, newPassword);
      setInfo(res.message || 'Password reset! You can now sign in.');
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const cardStyle = {
    background: 'var(--bg-card, #1e1e2e)', border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg, 16px)', padding: '32px 28px', width: '100%', maxWidth: 400,
    position: 'relative',
  };
  const closeBtn = {
    position: 'absolute', top: 14, right: 16,
    background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20,
    cursor: 'pointer', lineHeight: 1,
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={cardStyle}>
        <button style={closeBtn} onClick={onClose}>✕</button>

        {step === 'request' && (
          <>
            <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: 18 }}>Reset Password</h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 13 }}>
              Enter your email and we'll send a reset link.
            </p>
            <form onSubmit={handleRequest}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  type="email" className="form-input" value={email} required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" style={{ width: '100%' }}
                />
              </div>
              {error && <ErrorBox msg={error} />}
              <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <Spinner label="Sending…" /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: 18 }}>Set New Password</h3>
            {info && <InfoBox msg={info} />}
            <form onSubmit={handleReset} style={{ marginTop: 12 }}>
              <div className="form-group">
                <label className="form-label">Reset Token</label>
                <input
                  className="form-input" value={token} required
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token from email" style={{ width: '100%' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password" className="form-input" value={newPassword} required
                  onChange={(e) => setNew(e.target.value)}
                  placeholder="Min 6 characters" style={{ width: '100%' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password" className="form-input" value={confirm} required
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password" style={{ width: '100%' }}
                />
              </div>
              {error && <ErrorBox msg={error} />}
              <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <Spinner label="Resetting…" /> : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
          <>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>Password Reset!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px' }}>
                You can now sign in with your new password.
              </p>
              <button className="login-btn" onClick={onClose}>Back to Sign In</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--radius-md)',
      background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
      color: 'var(--rose)', fontSize: 13, marginBottom: 12,
    }}>{msg}</div>
  );
}

function InfoBox({ msg }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--radius-md)',
      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
      color: '#4ade80', fontSize: 13, marginBottom: 12,
    }}>{msg}</div>
  );
}

function Spinner({ label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <span className="spinner" /> {label}
    </span>
  );
}

// ── Main Login Component ──────────────────────────────────────────────────────
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="login-page">
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {/* Left feature list */}
      <div style={{
        position: 'absolute', left: '5%', top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 14,
        opacity: 0.65,
      }}>
        {[
          'RAG-Powered Retrieval',
          'Hybrid Search (Semantic + Keyword)',
          'Source Attribution',
          'Role-Based Access Control',
          'Groq AI Models',
        ].map((f, i) => (
          <div key={f} className="animate-fade-left" style={{ animationDelay: `${i * 80}ms` }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-muted)',
            }}>
              <span style={{ color: 'var(--indigo-light)' }}>✓</span> {f}
            </div>
          </div>
        ))}
      </div>

      <div className="login-card" style={{ position: 'relative', zIndex: 1 }}>
        <div className="login-logo">
          <div className="login-logo-icon">🧠</div>
          <div className="login-title gradient-text">KnowledgeAI</div>
          <div className="login-sub">Sign in to your workspace</div>
        </div>

        {/* Role quick-fill */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {ROLE_DEMO.map((d) => (
            <button
              key={d.role}
              onClick={() => fillDemo(d.email)}
              style={{
                flex: 1, padding: '7px 6px', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = d.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <span style={{ fontSize: 16 }}>{d.icon}</span>
              <span style={{ color: d.color, fontWeight: 600 }}>{d.label}</span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>
          ↑ Click a role to auto-fill demo credentials
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email" className="form-input" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com" required style={{ width: '100%' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Password
              <span
                style={{ color: 'var(--indigo-light)', fontSize: 12, cursor: 'pointer' }}
                onClick={() => setShowForgot(true)}
              >
                Forgot password?
              </span>
            </label>
            <input
              type="password" className="form-input" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required style={{ width: '100%' }}
            />
          </div>

          {error && <ErrorBox msg={error} />}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <Spinner label="Signing in…" /> : 'Sign in to workspace'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--indigo-light)', textDecoration: 'none', fontWeight: 600 }}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}