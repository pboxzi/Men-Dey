import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-sm">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="text-red-500 text-lg">!</span>
            </div>
            <h3 className="text-sm font-bold text-[#111]">Something went wrong</h3>
            <p className="text-xs text-[#444]">
              This section couldn't load. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-bold text-[#C89B3C] border border-[#C89B3C]/30 rounded-lg hover:bg-[#C89B3C]/5 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
