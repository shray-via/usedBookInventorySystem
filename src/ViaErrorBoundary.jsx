import React from 'react';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fafafa',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#1a1a1a',
  padding: '24px',
  zIndex: 999999,
};

const headingStyle = {
  fontSize: '20px',
  fontWeight: 600,
  marginBottom: '8px',
};

const detailStyle = {
  fontSize: '14px',
  color: '#666',
  marginBottom: '24px',
  maxWidth: '480px',
  textAlign: 'center',
  wordBreak: 'break-word',
};

const buttonStyle = {
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#fff',
  backgroundColor: '#111',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

class ViaErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    try {
      const payload = [{
        ts: Date.now(),
        type: 'error',
        message: error?.message || 'React render error',
        stack: error?.stack,
        componentStack: info?.componentStack,
      }];
      fetch('/api/__via/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (_) {
      // never throw from the error boundary itself
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={overlayStyle}>
          <div style={headingStyle}>Something went wrong</div>
          <div style={detailStyle}>{this.state.errorMessage}</div>
          <button style={buttonStyle} onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ViaErrorBoundary;
