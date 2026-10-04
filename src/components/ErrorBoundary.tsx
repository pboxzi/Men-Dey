import {Component, type ErrorInfo, type ReactNode} from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{children: ReactNode}, State> {
  state: State = {error: null};

  static getDerivedStateFromError(error: Error): State {
    return {error};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-alabaster px-6">
        <div className="surface max-w-md p-8 text-center">
          <p className="eyebrow mb-3">Unexpected error</p>
          <h1 className="mb-3 text-2xl">Something went wrong</h1>
          <p className="mb-6 text-sm text-muted">
            The page could not be displayed. Your data is safe — please reload to continue.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </main>
    );
  }
}
