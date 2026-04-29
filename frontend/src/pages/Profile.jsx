import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, getStoredPrefs } from '../services/api';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const role = user?.role || 'trainee';

  const ROLE_CONFIG = {
    admin:   { color: 'var(--rose)',    icon: '👑', label: 'Admin' },
    mentor:  { color: 'var(--violet)', icon: '🎓', label: 'Mentor' },
    trainee: { color: 'var(--cyan)',   icon: '🌱', label: 'Trainee' },
  };
  const rc = ROLE_CONFIG[role];
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const [tab, setTab] = useState('profile');

  // Profile tab state
  const [name, setName]           = useState(user?.name || '');
  const [workspace, setWorkspace] = useState(user?.workspace || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState(null);

  // Security tab state
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwMsg, setPwMsg]           = useState(null);

  // Preferences tab state
  const [ragMode, setRagMode]       = useState('hybrid');
  const [resultCount, setResultCount] = useState('5');
  const [prefMsg, setPrefMsg]       = useState(null);

  useEffect(() => {
    setName(user?.name || '');
    setWorkspace(user?.workspace || '');
  }, [user?.name, user?.workspace]);

  useEffect(() => {
    const prefs = user?.preferences || getStoredPrefs();
    setRagMode(prefs.ragMode || 'hybrid');
    setResultCount(String(prefs.resultCount || 5));
  }, [user]);

  const showMsg = (setter, text, type = 'success') => {
    setter({ text, type });
    setTimeout(() => setter(null), 3000);
  };

  // ── Save Profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!name.trim()) { showMsg(setProfileMsg, 'Name cannot be empty', 'error'); return; }
    setProfileSaving(true);
    try {
      const { user: updatedUser } = await authAPI.updateProfile({
        name: name.trim(),
        workspace: workspace.trim(),
      });
      updateUser(updatedUser);
      showMsg(setProfileMsg, 'Profile saved successfully!');
    } catch (err) {
      showMsg(setProfileMsg, `Failed: ${err.message}`, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Save Password ──────────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      showMsg(setPwMsg, 'All password fields are required', 'error'); return;
    }
    if (newPw !== confirmPw) {
      showMsg(setPwMsg, 'New passwords do not match', 'error'); return;
    }
    if (newPw.length < 6) {
      showMsg(setPwMsg, 'Password must be at least 6 characters', 'error'); return;
    }
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: currentPw, newPassword: newPw });
      showMsg(setPwMsg, 'Password updated successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      showMsg(setPwMsg, err.message || 'Failed to update password', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Save Preferences ───────────────────────────────────────────────────────
  const handleSavePreferences = async () => {
    try {
      const payload = { ragMode, resultCount: parseInt(resultCount, 10) };
      localStorage.setItem('knowledgeai_prefs', JSON.stringify(payload));
      const { user: updatedUser } = await authAPI.updatePreferences(payload);
      updateUser(updatedUser);
      showMsg(setPrefMsg, 'Preferences saved!');
    } catch (err) {
      showMsg(setPrefMsg, err.message || 'Failed to save preferences', 'error');
    }
  };

  const TABS = [
    { id: 'profile',     label: '👤 Profile' },
    { id: 'security',    label: '🔒 Security' },
    { id: 'preferences', label: '⚙️ Preferences' },
  ];

  const MsgBanner = ({ msg }) => msg ? (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--radius-md)', marginTop: 12,
      background: msg.type === 'error' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
      border: `1px solid ${msg.type === 'error' ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`,
      color: msg.type === 'error' ? 'var(--rose)' : 'var(--emerald)',
      fontSize: 13,
    }}>
      {msg.type === 'error' ? '❌' : '✅'} {msg.text}
    </div>
  ) : null;

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div className="animate-fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          Profile <span className="gradient-text">&amp; Settings</span>
        </h1>
      </div>

      {/* Profile header card */}
      <div className="animate-fade-up delay-100" style={{
        padding: '24px 28px', borderRadius: 'var(--radius-xl)',
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(20px)', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${rc.color}, var(--indigo))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 700, color: 'white',
          boxShadow: `0 0 28px ${rc.color}40`,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 12px', borderRadius: 'var(--radius-full)',
              background: `${rc.color}18`, border: `1px solid ${rc.color}30`,
              fontSize: 12, fontWeight: 700, color: rc.color,
            }}>{rc.icon} {rc.label}</span>
            {user?.workspace && (
              <span style={{
                padding: '3px 12px', borderRadius: 'var(--radius-full)',
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
                fontSize: 12, fontWeight: 600, color: 'var(--indigo-light)',
              }}>🏢 {user.workspace}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--glass-border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '9px 20px', background: 'none', border: 'none',
            borderBottom: tab === t.id ? '2px solid var(--indigo)' : '2px solid transparent',
            color: tab === t.id ? 'var(--indigo-light)' : 'var(--text-muted)',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div style={{
        padding: '24px', borderRadius: 'var(--radius-lg)',
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(20px)',
      }}>

        {/* ── Profile ── */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input className="form-input" value={name}
                onChange={e => setName(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input className="form-input" value={user?.email || ''}
                disabled style={{ width: '100%', opacity: 0.5 }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Email cannot be changed
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Organization / Workspace</label>
              <input className="form-input" value={workspace}
                onChange={e => setWorkspace(e.target.value)}
                placeholder="Company name" style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role</label>
              <input className="form-input" value={`${rc.icon} ${rc.label}`}
                disabled style={{ width: '100%', opacity: 0.5 }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Role can only be changed by an Admin
              </div>
            </div>
            <MsgBanner msg={profileMsg} />
            <button onClick={handleSaveProfile} className="btn btn-primary"
              style={{ alignSelf: 'flex-start', marginTop: 4 }} disabled={profileSaving}>
              {profileSaving
                ? <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="spinner" /> Saving…</span>
                : '💾 Save Changes'}
            </button>
          </div>
        )}

        {/* ── Security ── */}
        {tab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Change Password</div>
            {[
              { label: 'Current Password', val: currentPw, set: setCurrentPw },
              { label: 'New Password',     val: newPw,     set: setNewPw },
              { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw },
            ].map(f => (
              <div key={f.label} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{f.label}</label>
                <input type="password" className="form-input" value={f.val}
                  onChange={e => f.set(e.target.value)}
                  placeholder="••••••••" style={{ width: '100%' }} />
              </div>
            ))}
            <MsgBanner msg={pwMsg} />
            <button onClick={handleSavePassword} className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }} disabled={pwSaving}>
              {pwSaving
                ? <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="spinner" /> Updating…</span>
                : '🔒 Update Password'}
            </button>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rose)', marginBottom: 12 }}>
                Danger Zone
              </div>
              <button onClick={() => { logout(); window.location.href = '/login'; }}
                className="btn" style={{
                  background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
                  color: 'var(--rose)',
                }}>
                🚪 Sign out of all devices
              </button>
            </div>
          </div>
        )}

        {/* ── Preferences ── */}
        {tab === 'preferences' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Default RAG / Search Mode</label>
              <select className="form-input" value={ragMode}
                onChange={e => setRagMode(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                <option value="hybrid">⚡ Hybrid — Semantic + Keyword (Recommended)</option>
                <option value="semantic">🧠 Semantic Only — Meaning-based</option>
                <option value="keyword"># Keyword Only — Exact word match</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Number of Source Results</label>
              <select className="form-input" value={resultCount}
                onChange={e => setResultCount(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                <option value="3">3 sources</option>
                <option value="5">5 sources (default)</option>
                <option value="10">10 sources</option>
              </select>
            </div>
            <MsgBanner msg={prefMsg} />
            <button onClick={handleSavePreferences} className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}>
              ⚙️ Save Preferences
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Preferences are saved locally in your browser.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}