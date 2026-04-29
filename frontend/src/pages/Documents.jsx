import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UploadCard from '../components/docs/UploadCard';
import DocumentList from '../components/docs/DocumentList';
import { documentsAPI } from '../services/api';

export default function Documents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showUpload, setShowUpload] = useState(user?.role !== 'trainee');
  const [toast, setToast]           = useState(null);

  const loadDocs = () => {
    setLoading(true);
    documentsAPI.list()
      .then((data) => { setDocuments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setDocuments([]); setLoading(false); });
  };

  useEffect(() => { loadDocs(); }, []);

  // Auto-refresh every 8 seconds if any doc is still processing
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing');
    if (!hasProcessing) return;
    const interval = setInterval(loadDocs, 8000);
    return () => clearInterval(interval);
  }, [documents]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUploaded = (doc) => {
    setDocuments(prev => [doc, ...prev]);
    showToast(`"${doc.original_name || doc.name}" uploaded. Indexing started…`);
    // Refresh after 5s to get updated status
    setTimeout(loadDocs, 5000);
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document and all its indexed chunks?')) return;
    try {
      await documentsAPI.delete(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      showToast('Document deleted from knowledge base.');
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleQuery = (doc) => {
    const name = doc.original_name || doc.name;
    navigate(`/chat?q=${encodeURIComponent(`Tell me about the document: ${name}`)}`);
  };

  const handleOpen = async (doc) => {
    try {
      const token = localStorage.getItem('knowledgeai_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${baseUrl}/documents/${doc.id}/open`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to open document');
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showToast(err.message || 'This document file could not be opened.', 'error');
    }
  };

  // Normalise for stats display
  const indexed    = documents.filter(d => d.status === 'indexed').length;
  const processing = documents.filter(d => d.status === 'processing').length;
  const failed     = documents.filter(d => d.status === 'failed').length;
  const totalChunks = documents.reduce((s, d) => s + (d.chunk_count || d.chunks || 0), 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              Knowledge <span className="gradient-text">Documents</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Upload and manage the documents powering your AI assistant.
            </p>
          </div>
          {user?.role !== 'trainee' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowUpload(v => !v)}
            >
              {showUpload ? '▲ Hide Upload' : '📤 Upload Files'}
            </button>
          )}
        </div>

        {/* Mini stats */}
        <div style={{
          display: 'flex', gap: 0, marginTop: 20,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}>
          {[
            { icon: '📄', value: documents.length, label: 'Total',      color: 'var(--indigo-light)' },
            { icon: '✅', value: indexed,           label: 'Indexed',    color: 'var(--emerald)' },
            { icon: '⏳', value: processing,        label: 'Processing', color: 'var(--amber)' },
            { icon: '✕',  value: failed,            label: 'Failed',     color: 'var(--rose)' },
            { icon: '✂️', value: totalChunks,       label: 'Chunks',     color: 'var(--cyan)' },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{
              flex: 1, padding: '16px 20px',
              borderRight: i < arr.length - 1 ? '1px solid var(--glass-border)' : 'none',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>{stat.icon}</span>
              <div>
                <div style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800,
                  color: stat.color, lineHeight: 1,
                }}>
                  {loading ? '—' : stat.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
              </div>
            </div>
          ))}

          <div style={{
            padding: '0 20px',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              fontSize: 12, color: 'var(--emerald)', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block' }} />
              pgvector Active
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {showUpload && user?.role !== 'trainee' && (
        <div className="animate-fade-up delay-100" style={{ marginBottom: 28 }}>
          <UploadCard
            onUploaded={handleUploaded}
            onError={(err) => showToast(`Upload failed: ${err.message}`, 'error')}
            workspaceId={null}
          />
        </div>
      )}

      {/* Document List */}
      <div className="animate-fade-up delay-200">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, display: 'inline-block' }} />
            <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>Loading documents…</div>
          </div>
        ) : (
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            onQuery={handleQuery}
            onOpen={handleOpen}
            user={user}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <span style={{ fontSize: 16 }}>
              {toast.type === 'error' ? '❌' : '✅'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}