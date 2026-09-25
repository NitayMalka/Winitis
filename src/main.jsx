import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { TextProvider } from './context/TextContext';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Crash Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0407',
          color: '#f3ede2',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#d4af37', marginBottom: '10px' }}>Something went wrong</h2>
          <p style={{ opacity: 0.8, maxWidth: '400px', fontSize: '0.85rem', marginBottom: '16px', wordBreak: 'break-word' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#b81d40',
              color: '#ffffff',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TextProvider>
        <App />
      </TextProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
