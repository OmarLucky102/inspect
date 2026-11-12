import React, { Component, type ReactNode } from 'react';
import { ErrorView } from './ErrorView';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[GlobalErrorBoundary caught rendering exception]:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-paper/60 p-4">
          <div className="w-full max-w-2xl">
            <ErrorView
              status={500}
              error={this.state.error}
              onRetry={this.handleReset}
              backUrl="/"
              backLabel="Return Home"
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

