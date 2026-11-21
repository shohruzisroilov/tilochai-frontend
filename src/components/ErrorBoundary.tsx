import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  resetKey?: any;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);

    // If chunk loading failed (e.g. after a new deployment or network drop),
    // automatically reload once so the user gets the fresh version
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch');

    if (isChunkError) {
      const hasReloaded = window.sessionStorage.getItem('chunk_error_reloaded');
      if (!hasReloaded) {
        window.sessionStorage.setItem('chunk_error_reloaded', 'true');
        window.location.reload();
      }
    }
  }

  public componentDidUpdate(prevProps: Props) {
    // If user navigated to a different screen or resetKey changed, reset error state
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '80vh',
              padding: '24px',
              textAlign: 'center',
              gap: '16px',
              color: 'var(--text-primary, #ffffff)',
              background: 'var(--bg, transparent)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                marginBottom: '4px',
              }}
            >
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary, #94A3B8)', margin: 0, fontSize: '14px', maxWidth: '280px', lineHeight: 1.5 }}>
              Please try reloading the app to get the latest updates.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                onClick={this.handleTryAgain}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: '1px solid var(--border, rgba(255,255,255,0.15))',
                  background: 'var(--surface-2, rgba(255,255,255,0.08))',
                  color: 'var(--text-primary, #fff)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Try again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--primary, #00A8FF)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0, 168, 255, 0.35)',
                }}
              >
                <RefreshCw size={14} />
                Reload
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
