import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-black">Oops! Something went wrong</h1>
                  <p className="text-red-100 text-sm mt-1">Don't worry, your data is safe</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900 mb-2">What happened?</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The app encountered an unexpected error. This is likely a temporary issue. 
                  Your data has been saved locally and will be synced when the app recovers.
                </p>
              </div>

              {/* Error details - collapsible */}
              {this.state.error && (
                <details className="mb-6">
                  <summary className="cursor-pointer text-sm font-bold text-slate-700 hover:text-brand mb-2">
                    Technical Details (for debugging)
                  </summary>
                  <div className="bg-slate-50 rounded-xl p-4 mt-2 border border-slate-200">
                    <div className="text-xs font-mono text-red-600 mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div className="text-xs font-mono text-slate-600 overflow-auto max-h-40">
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-red-100"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold transition-all active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload App
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all active:scale-95 border border-slate-200"
                >
                  <Home className="w-5 h-5" />
                  Go to Homepage
                </button>
              </div>

              {/* Help text */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>💡 Tip:</strong> If this error persists, try clearing your browser cache 
                  or logging out and back in. Your data is safely stored and will be restored.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
