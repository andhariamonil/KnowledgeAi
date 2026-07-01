import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const UPLOADS_BASE = API_BASE.replace(/\/api$/, '');

const TYPE_CONFIG = {
  pdf:  { icon: '📄', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.2)' },
  doc:  { icon: '📝', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.2)' },
  docx: { icon: '📝', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.2)' },
  md:   { icon: '📋', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.2)' },
  csv:  { icon: '📊', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.2)' },
  xlsx: { icon: '📊', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.2)' },
  txt:  { icon: '📃', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.2)' },
};

// ── Normalise backend snake_case → frontend camelCase ─────────────────────────
// Backend returns: original_name, file_size, file_type, chunk_count, created_at
// Frontend expects: name, size, type, chunks, uploadedAt
function normalise(doc) {
  return {
    ...doc,
    name:       doc.original_name || doc.name || 'Unnamed file',
    size:       doc.file_size     || doc.size || 0,
    type:       doc.file_type     || doc.type || 'txt',
    chunks:     doc.chunk_count   ?? doc.chunks ?? 0,
    uploadedAt: doc.created_at    || doc.uploadedAt || null,
    uploadedBy: doc.uploaded_by_name || doc.uploadedBy || null,
    fileUrl:    doc.file_url || doc.fileUrl || (doc.name ? `${UPLOADS_BASE}/uploads/${encodeURIComponent(doc.name)}` : null),
  };
}

function formatSize(bytes) {
  const b = parseInt(bytes, 10);
  if (!b || isNaN(b)) return 'Unknown size';
  if (b < 1024)        return `${b} B`;
  if (b < 1_048_576)   return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Only search is supported on the frontend; filter buttons are removed.

export default function DocumentList({ documents = [], onDelete, onQuery, onOpen, user }) {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm]     = useState('');

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) setSearchTerm(search);
  }, [searchParams]);

  // Normalise all docs first
  const normDocs = documents.map(normalise);

  const filtered = normDocs.filter((doc) => {
    return doc.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      {/* Search + Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 300 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none',
          }}>🔍</span>
          <input
            className="form-input"
            placeholder="Search documents…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 36, margin: 0 }}
          />
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} document{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No documents found</div>
          <div style={{ fontSize: 13 }}>
            {documents.length === 0
              ? 'Upload your first document to get started.'
              : 'Try adjusting your search.'}
          </div>
        </div>
      ) : (
        <div className="doc-grid">
          {filtered.map((doc, i) => {
            const cfg = TYPE_CONFIG[doc.type] || TYPE_CONFIG.txt;
            return (
              <div
                key={doc.id}
                className="doc-card animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="doc-card-header">
                  <div
                    className="doc-type-icon"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Show original filename, not the stored UUID name */}
                    <div className="doc-name" title={doc.name}>{doc.name}</div>
                    <div className="doc-meta">
                      {formatSize(doc.size)} · {formatDate(doc.uploadedAt)}
                    </div>
                    {doc.uploadedBy && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        by {doc.uploadedBy}
                      </div>
                    )}
                  </div>
                </div>

                {/* Indexed info */}
                {doc.status === 'indexed' && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 12, color: 'var(--text-muted)', padding: '8px 0',
                  }}>
                    <span>✂️ {doc.chunks} chunks</span>
                    <span>🔢 Vectors indexed</span>
                  </div>
                )}

                {/* Processing */}
                {doc.status === 'processing' && (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 4 }}>
                      ⏳ Parsing & embedding…
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '60%' }} />
                    </div>
                  </>
                )}

                {/* Failed — show retry hint */}
                {doc.status === 'failed' && (
                  <div style={{
                    fontSize: 11, color: 'var(--rose)',
                    padding: '6px 0',
                    lineHeight: 1.5,
                  }}>
                    ⚠️ Indexing failed. The file may be empty, unsupported, or parsing may have failed. Try re-uploading and check the backend logs if it keeps happening.
                  </div>
                )}

                <div className="doc-card-footer">
                  <div className={`doc-status ${doc.status}`}>
                    {doc.status === 'indexed'    && '● Indexed'}
                    {doc.status === 'processing' && '◌ Processing'}
                    {doc.status === 'failed'     && '✕ Failed'}
                  </div>

                  <div
                    className="doc-actions"
                  >
                    <button
                      type="button"
                      className="doc-open-btn"
                      title="Open document"
                      onClick={() => onOpen?.(doc)}
                    >
                      Open
                    </button>
                    {(user?.role === 'admin' || user?.role === 'mentor') && (
  <button
    type="button"
    className="doc-delete-btn"
    title="Delete document"
    onClick={() => onDelete?.(doc.id)}
  >
    🗑 Delete
  </button>
)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}