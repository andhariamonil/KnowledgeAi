import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ChatBox from '../components/chat/ChatBox';
import { chatAPI, getStoredPrefs } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SEARCH_MODES = [
  { value: 'hybrid', label: 'Hybrid (Recommended)' },
  { value: 'semantic', label: 'Semantic Only' },
  { value: 'keyword', label: 'Keyword Only' },
];

function normaliseSession(session) {
  return {
    ...session,
    createdAt: session.createdAt || session.created_at,
    updatedAt: session.updatedAt || session.updated_at,
    messageCount: Number(session.messageCount ?? session.message_count ?? 0),
  };
}

function normaliseMessage(message) {
  return {
    ...message,
    timestamp: message.timestamp || message.created_at,
  };
}

function SessionsPanel({ sessions, activeId, onSelect, onNew, loading, isOpen, searchMode, onModeChange }) {
  return (
    <div className={`chat-sessions-panel ${isOpen ? 'open' : ''}`}>
      <div className="sessions-header">
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          Conversations
        </span>
        <button className="new-chat-btn" onClick={onNew}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading ? (
          <div style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            Loading…
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No conversations yet</div>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`session-item ${activeId === s.id ? 'active' : ''}`}
              onClick={() => onSelect(s)}
            >
              <div className="session-title">{s.title}</div>
              <div className="session-meta">
                <span className="session-time">
                  {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="session-count">{s.messageCount} msgs</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RAG Mode Selector */}
      <div style={{
        padding: 12,
        borderTop: '1px solid var(--glass-border)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Search Mode
        </div>
        {SEARCH_MODES.map((mode) => (
          <label
            key={mode.value}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', marginBottom: 2,
              background: searchMode === mode.value ? 'rgba(99,102,241,0.1)' : 'transparent',
              border: searchMode === mode.value ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
            }}
          >
            <input
              type="radio"
              name="rag-mode"
              checked={searchMode === mode.value}
              onChange={() => onModeChange(mode.value)}
              style={{ accentColor: 'var(--indigo)' }}
            />
            <span style={{ fontSize: 12, color: searchMode === mode.value ? 'var(--indigo-light)' : 'var(--text-muted)' }}>
              {mode.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { sessionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const savedPrefs = user?.preferences || getStoredPrefs();
  const workspaceId = user?.workspace || '';

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState(savedPrefs.ragMode || 'hybrid');
  const [resultCount, setResultCount] = useState(savedPrefs.resultCount || 5);

  useEffect(() => {
    const prefs = user?.preferences || getStoredPrefs();
    setSearchMode(prefs.ragMode || 'hybrid');
    setResultCount(prefs.resultCount || 5);
  }, [user]);

  // Load sessions on mount
  useEffect(() => {
    setSessionsLoading(true);
    chatAPI.getSessions(workspaceId)
      .then((data) => {
        const normalised = Array.isArray(data) ? data.map(normaliseSession) : [];
        setSessions(normalised);
        if (sessionId) {
          const found = normalised.find((s) => s.id === sessionId);
          setActiveSession(found || null);
        } else {
          setActiveSession(null);
          setMessages([]);
        }
      })
      .finally(() => setSessionsLoading(false));
  }, [sessionId, workspaceId]);

  useEffect(() => {
    if (!activeSession?.id) return;
    chatAPI.getMessages(activeSession.id).then((data) => {
      setMessages(Array.isArray(data) ? data.map(normaliseMessage) : []);
    });
  }, [activeSession?.id]);

  // Handle ?q= from global search
  useEffect(() => {
    const q = searchParams.get('q');
    if (!q) return;
    handleSend(q);
  }, [searchParams]); // eslint-disable-line

  const handleNewChat = async () => {
    const session = normaliseSession(await chatAPI.createSession(undefined, workspaceId));
    setSessions((prev) => [session, ...prev]);
    setActiveSession(session);
    setMessages([]);
    setIsSessionsOpen(false);
    navigate(`/chat/${session.id}`);
  };

  const handleSelectSession = (session) => {
    setActiveSession(session);
    setIsSessionsOpen(false);
    navigate(`/chat/${session.id}`);
  };

  const handleSend = async (text) => {
    // Create session if none active
    let session = activeSession;
    if (!session) {
      session = normaliseSession(await chatAPI.createSession(text.slice(0, 50), workspaceId));
      setSessions((prev) => [session, ...prev]);
      setActiveSession(session);
      navigate(`/chat/${session.id}`);
    }

    const userMsg = {
      id: `m_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const reply = normaliseMessage(
        await chatAPI.sendMessage(session.id, text, workspaceId, searchMode, resultCount)
      );
      setMessages((prev) => [...prev, reply]);
      setSessions((prev) =>
        prev.map((item) =>
          item.id === session.id
            ? { ...item, title: item.title === 'New Chat' ? text.slice(0, 80) : item.title, messageCount: (item.messageCount || 0) + 2 }
            : item
        )
      );
      if (searchParams.get('q')) {
        setSearchParams((params) => {
          params.delete('q');
          return params;
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `m_err_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          sources: [],
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleModeChange = (mode) => {
    setSearchMode(mode);
    const nextPrefs = { ...(user?.preferences || getStoredPrefs()), ragMode: mode, resultCount };
    localStorage.setItem('knowledgeai_prefs', JSON.stringify(nextPrefs));
    if (user) updateUser({ ...user, preferences: nextPrefs });
  };

  return (
    <div className="chat-layout">
      {isSessionsOpen && (
        <div
          className="chat-sessions-overlay"
          onClick={() => setIsSessionsOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close conversations drawer"
        />
      )}
      <SessionsPanel
        sessions={sessions}
        activeId={activeSession?.id}
        onSelect={handleSelectSession}
        onNew={handleNewChat}
        loading={sessionsLoading}
        isOpen={isSessionsOpen}
        searchMode={searchMode}
        onModeChange={handleModeChange}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat Header */}
        <div
          style={{
            padding: activeSession ? '12px 24px' : '10px 16px',
            borderBottom: activeSession ? '1px solid var(--glass-border)' : '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(6,8,18,0.4)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <button
            className="navbar-icon-btn hide-desktop"
            title="Conversations"
            onClick={() => setIsSessionsOpen(true)}
            style={{ fontSize: 14 }}
          >
            ☰
          </button>

          {activeSession ? (
            <>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--indigo), var(--violet))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, boxShadow: '0 0 16px rgba(99,102,241,0.3)',
              }}>
                💬
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeSession.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {messages.length} messages · {searchMode} search · pgvector
                </div>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                  className="navbar-icon-btn"
                  title="Export conversation"
                  style={{ fontSize: 13 }}
                >
                  ↗
                </button>
                <button
                  className="navbar-icon-btn"
                  title="Clear conversation"
                  onClick={() => setMessages([])}
                  style={{ fontSize: 13 }}
                >
                  🗑
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800 }}>
                Start a conversation
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="new-chat-btn" onClick={handleNewChat}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New
                </button>
              </div>
            </>
          )}
        </div>

        <ChatBox
          messages={messages}
          onSend={handleSend}
          isTyping={isTyping}
          searchMode={searchMode}
        />
      </div>
    </div>
  );
}