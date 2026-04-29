import React, { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSend, disabled = false, searchMode = 'hybrid' }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-area">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your company documents…"
          rows={1}
          disabled={disabled}
        />

        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          title="Send (Enter)"
        >
          {disabled ? (
            <span style={{ display: 'flex' }}>
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            </span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div className="chat-input-actions">

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
          <kbd style={{
            padding: '1px 5px', borderRadius: 3,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            fontSize: 10,
          }}>Enter</kbd>
          to send ·
          <kbd style={{
            padding: '1px 5px', borderRadius: 3,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            fontSize: 10,
          }}>Shift+Enter</kbd>
          for newline
        </div>
      </div>
    </div>
  );
}