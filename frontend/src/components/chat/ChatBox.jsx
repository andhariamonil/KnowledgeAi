import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const SUGGESTIONS = [
  'What is our employee onboarding process?',
  'Summarize Q3 financial results',
  'What is our deployment pipeline?',
  'How many vacation days do employees get?',
];

function TypingIndicator() {
  return (
    <div className="message-row">
      <div className="message-avatar ai">🧠</div>
      <div className="message-content">
        <div className="message-bubble ai" style={{ padding: '10px 18px' }}>
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatBox({ messages, onSend, onDelete, isTyping }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="chatbox">
      <div className="chatbox-messages">
        {messages.length === 0 ? (
          <div className="chatbox-empty animate-fade-scale">
            <div className="chatbox-empty-icon">🧠</div>
            <div>
              <div className="chatbox-empty-title gradient-text">Ask your knowledge base</div>
              <div className="chatbox-empty-sub">
                Query PDFs, Slack threads, emails, and documents using natural language.
              </div>
            </div>
            <div className="suggestion-chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => onSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onDelete={onDelete} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <ChatInput onSend={onSend} disabled={isTyping} />
    </div>
  );
}