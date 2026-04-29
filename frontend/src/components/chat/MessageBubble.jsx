import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SOURCE_TYPE_CONFIG = {
  pdf:   { emoji: '📄', className: 'source-pdf' },
  doc:   { emoji: '📝', className: 'source-doc' },
  docx:  { emoji: '📝', className: 'source-doc' },
  slack: { emoji: '💼', className: 'source-slack' },
  email: { emoji: '📧', className: 'source-email' },
  md:    { emoji: '📋', className: 'source-doc' },
  csv:   { emoji: '📊', className: 'source-doc' },
  txt:   { emoji: '📃', className: 'source-doc' },
};

function SourceChip({ source, index, onOpen }) {
  const type = source.type || source.file_type || 'doc';
  const cfg  = SOURCE_TYPE_CONFIG[type] || SOURCE_TYPE_CONFIG.doc;

  const displayName = source.original_name || source.name || source.source || 'Document';
  const cleanName = displayName;

  return (
    <div className="source-item" style={{ marginBottom: 12 }}>
      <button
        type="button"
        className={`source-chip ${cfg.className}`}
        title={displayName}
        style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: 12 }}
        onClick={() => onOpen?.(source)}
      >
        <span>{cfg.emoji}</span>
        <span style={{ fontWeight: 600 }}>Source {index}: {cleanName}</span>
      </button>
      {source.content && (
        <div style={{
          marginTop: 6,
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.03)',
          borderLeft: '2px solid var(--indigo)',
          borderRadius: '0 4px 4px 0',
          fontSize: 11,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          fontStyle: 'italic',
          maxWidth: '100%',
          overflowWrap: 'break-word'
        }}>
          "...{source.content.length > 200 ? source.content.slice(0, 200) + '...' : source.content}"
        </div>
      )}
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Parse sources whether stored as JSON string or array
function parseSources(sources) {
  if (!sources) return [];
  if (typeof sources === 'string') {
    try { return JSON.parse(sources); } catch { return []; }
  }
  if (Array.isArray(sources)) return sources;
  return [];
}

export default function MessageBubble({ message, onDelete }) {
  const isUser  = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const sources = parseSources(message.sources);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let content = message.content || '';
  if (typeof content === 'string' && content.includes('model is warming up')) {
    content = 'The AI model is starting up. Please try your query again in a few seconds.';
  }

  const openSource = (source) => {
    const label = source.original_name || source.name || source.source || '';
    const params = new URLSearchParams();
    if (source.documentId) params.set('documentId', source.documentId);
    if (label) params.set('search', label);
    navigate(`/documents?${params.toString()}`);
  };

  return (
    <div className={`message-row ${isUser ? 'user' : ''}`}>
      <div className={`message-avatar ${isUser ? 'user-av' : 'ai'}`}>
        {isUser ? '👤' : '🧠'}
      </div>

      <div className="message-content">
        <div 
          className={`message-bubble ${isUser ? 'user' : 'ai'}`}
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {String(content)}
        </div>

          {/* Action buttons */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isUser && (
              <button
                onClick={handleCopy}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {copied ? '✓ Copied' : '⎘ Copy'}
              </button>
            )}
          </div>

        {/* Sources — only for AI messages with sources */}
        {!isUser && Array.isArray(sources) && sources.length > 0 && (
          <div className="sources-section">
            <div className="sources-label">Sources used</div>
            <div className="source-chips">
              {sources.map((src, i) => {
                if (!src) return null;
                return <SourceChip key={i} source={src} index={i + 1} onOpen={openSource} />;
              })}
            </div>
          </div>
        )}

        <div className="message-time">{formatTime(message.timestamp || message.created_at)}</div>
      </div>
    </div>
  );
}