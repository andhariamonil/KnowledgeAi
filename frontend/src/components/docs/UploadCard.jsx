import React, { useState, useRef } from 'react';
import { documentsAPI } from '../../services/api';

const ACCEPTED_TYPES = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv', '.xlsx'];

export default function UploadCard({ onUploaded, onError }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);
    setProgress(0);

    try {
      const doc = await documentsAPI.upload(file, (p) => setProgress(p));
      onUploaded?.(doc);
    } catch (err) {
      onError?.(err);
    } finally {
      setUploading(false);
      setProgress(0);
      setFileName('');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div
      className={`upload-zone ${dragging ? 'dragging' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading ? (
        <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
            Uploading {fileName}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Parsing, chunking and generating embeddings…
          </div>
          <div className="progress-bar" style={{ width: '100%' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--indigo-light)', marginTop: 8, textAlign: 'center' }}>
            {progress}% complete
          </div>
        </div>
      ) : (
        <>
          <div className="upload-icon">📤</div>
          <div className="upload-title">Drop files here or click to upload</div>
          <div className="upload-sub">
            Supports PDF, Word, Markdown, CSV, Excel, and plain text files.
            <br />
            Maximum file size: 50MB per file.
          </div>
          <div className="format-chips">
            {ACCEPTED_TYPES.map((t) => (
              <span key={t} className="format-chip">{t.toUpperCase().replace('.', '')}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}