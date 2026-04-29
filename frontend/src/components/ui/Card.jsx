import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  headerRight,
  footer,
  className = '',
  style,
  onClick,
  noPadding = false,
}) {
  return (
    <div
      className={`glass ${className}`}
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'all var(--transition-base)',
        ...style,
      }}
      onClick={onClick}
    >
      {(title || headerRight) && (
        <div className="card-header">
          <div>
            {title && <div className="card-title">{title}</div>}
            {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}

      <div style={noPadding ? {} : { padding: '20px 24px' }}>
        {children}
      </div>

      {footer && (
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--glass-border)',
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}