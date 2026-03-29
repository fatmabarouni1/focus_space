import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from '@/app/components/ErrorFallback';

interface ErrorBoundaryFallbackProps {
  error: Error | null;
  reset: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: ErrorBoundaryFallbackProps) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  private reset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.reset,
        });
      }

      return <ErrorFallback error={this.state.error} onRetry={this.reset} />;
    }

    return this.props.children;
  }
}

export type { ErrorBoundaryFallbackProps, ErrorBoundaryProps };
