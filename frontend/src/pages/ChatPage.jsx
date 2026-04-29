import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ChatBox from '../components/chat/ChatBox';
import { chatAPI, getStoredPrefs } from '../services/api';
import { useAuth } from '../contexts/AuthContext';



function normaliseSession(session) {
  if (!session) return null;
  return {
    ...session,
    id: session.id || '',
    title: session.title || 'New Chat',
    createdAt: session.createdAt || session.created_at || new Date().toISOString(),
    updatedAt: session.updatedAt || session.updated_at || new Date().toISOString(),
    messageCount: Number(session.messageCount ?? session.message_count ?? 0),
  };
}

function normaliseMessage(message) {
  if (!message) return null;
  // Ensure we don't overwrite an existing stable ID with a random one
  return {
    ...message,
    id: message.id || message._id || `m_tmp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    content: message.content || '',
    role: message.role || 'assistant',
    timestamp: message.timestamp || message.created_at || new Date().toISOString(),
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
              style={{ position: 'relative', group: 'true' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="session-title">{s.title}</div>
                <div className="session-meta">
                  <span className="session-time">
                    {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="session-count">{s.messageCount} msgs</span>
                </div>
              </div>
              <button
                className="session-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this conversation?')) onSelect(s, true);
                }}
                style={{
                  padding: '4px 8px', borderRadius: 4, background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
                  opacity: activeId === s.id ? 1 : 0, transition: 'opacity 0.2s',
                }}
              >
                🗑
              </button>
            </div>
          ))
        )}
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

  const handleSend = async (text) => {
    if (!text?.trim()) return;
    
    try {
      // Create session if none active
      let session = activeSession;
      if (!session) {
        const rawSession = await chatAPI.createSession(text.slice(0, 50));
        session = normaliseSession(rawSession);
        if (!session) throw new Error('Failed to create session');
        
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

      const reply = normaliseMessage(
        await chatAPI.sendMessage(session.id, text, searchMode, resultCount)
      );

      // Only add if we are still on the same session and message isn't already there
      setMessages((prev) => {
        if (prev.some(m => m.id === reply.id)) return prev;
        return [...prev, reply];
      });

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
      console.error('handleSend error:', err);
      // Only show error if we haven't successfully received a reply
      setMessages((prev) => {
        const hasBotReply = prev.some(m => m.role === 'assistant' && !m.id.startsWith('m_err'));
        if (hasBotReply) return prev;
        return [
          ...prev,
          {
            id: `m_err_${Date.now()}`,
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
            sources: [],
            timestamp: new Date().toISOString(),
          },
        ];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const raw = await chatAPI.createSession(undefined);
      const session = normaliseSession(raw);
      if (!session) return;
      setSessions((prev) => [session, ...prev]);
      setActiveSession(session);
      setMessages([]);
      setIsSessionsOpen(false);
      navigate(`/chat/${session.id}`);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleSelectSession = (session, isDelete = false) => {
    if (isDelete) {
      chatAPI.deleteSession(session.id).then(() => {
        setSessions((prev) => prev.filter((s) => s.id !== session.id));
        if (activeSession?.id === session.id) {
          navigate('/chat');
        }
      });
      return;
    }
    setIsSessionsOpen(false);
    navigate(`/chat/${session.id}`);
  };

  const handleModeChange = (mode) => {
    setSearchMode(mode);
    const nextPrefs = { ...(user?.preferences || getStoredPrefs()), ragMode: mode, resultCount };
    localStorage.setItem('knowledgeai_prefs', JSON.stringify(nextPrefs));
    if (user) updateUser({ ...user, preferences: nextPrefs });
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await chatAPI.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Delete message failed:', err);
    }
  };

  // Load sessions on mount
  useEffect(() => {
    setSessionsLoading(true);
    chatAPI.getSessions()
      .then((data) => {
        const normalised = Array.isArray(data) ? data.map(normaliseSession).filter(Boolean) : [];
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
  }, [sessionId]);

  useEffect(() => {
    if (!activeSession?.id) return;
    chatAPI.getMessages(activeSession.id).then((data) => {
      setMessages(Array.isArray(data) ? data.map(normaliseMessage).filter(Boolean) : []);
    });
  }, [activeSession?.id]);

  // Handle ?q= from global search
  useEffect(() => {
    const q = searchParams.get('q');
    if (!q) return;
    handleSend(q);
  }, [searchParams]); // eslint-disable-line

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
                  {messages.length} messages · pgvector
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
                  title="Delete conversation"
                  onClick={() => handleSelectSession(activeSession, true)}
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
          onDelete={handleDeleteMessage}
          isTyping={isTyping}
          searchMode={searchMode}
        />
      </div>
    </div>
  );
}