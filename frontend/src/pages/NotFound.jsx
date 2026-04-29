import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 80 }}>🌌</div>
      <h1 style={{ fontFamily: 'Syne', fontSize: 48, fontWeight: 800, background: 'linear-gradient(135deg, var(--indigo-light), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>404</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>This page doesn't exist in the knowledge base.</p>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
    </div>
  );
}