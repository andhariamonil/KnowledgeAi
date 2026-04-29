import React, { forwardRef } from 'react';

const Input = forwardRef(function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  icon,
  iconRight,
  className = '',
  disabled = false,
  required = false,
  ...props
}, ref) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span style={{ color: 'var(--rose)', marginLeft: 3 }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
            pointerEvents: 'none',
          }}>
            {icon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="form-input"
          style={{
            width: '100%',
            paddingLeft: icon ? 40 : 16,
            paddingRight: iconRight ? 40 : 16,
            borderColor: error ? 'var(--rose)' : undefined,
            opacity: disabled ? 0.5 : 1,
          }}
          {...props}
        />

        {iconRight && (
          <div style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
          }}>
            {iconRight}
          </div>
        )}
      </div>

      {error && <div style={{ fontSize: 12, color: 'var(--rose)', marginTop: 4 }}>{error}</div>}
      {hint && !error && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
});

export default Input;