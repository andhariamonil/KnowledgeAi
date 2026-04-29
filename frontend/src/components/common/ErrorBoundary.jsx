import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', background: 'var(--bg-dark)', color: 'white', padding: 40, textAlign: 'center'
        }}>
          <h1 style={{ fontSize: 48, marginBottom: 16 }}>Oops!</h1>
          <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 24 }}>
            Something went wrong. Please try refreshing the page.
          </p>
          <div style={{
            padding: 20, background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)',
            borderRadius: 12, maxWidth: 600, width: '100%', overflow: 'auto', textAlign: 'left',
            fontFamily: 'monospace', fontSize: 13
          }}>
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 32, padding: '12px 24px', background: 'var(--indigo)',
              border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
