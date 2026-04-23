import React, { ReactNode, ReactElement } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactElement;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  declare state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // TODO: Send error to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center bg-surface px-4">
            <div className="max-w-md rounded-lg bg-surface-container-highest p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <AlertCircle size={24} className="mt-1 flex-shrink-0 text-error" />
                <div>
                  <h2 className="text-lg font-semibold text-on-surface">Something went wrong</h2>
                  <p className="mt-2 text-sm text-on-surface/70">
                    {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
