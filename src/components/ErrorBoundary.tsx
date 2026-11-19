import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string; path?: string };
      if (parsed && parsed.error) {
        readable = `Database operation (${parsed.operationType || 'request'} on ${parsed.path || 'resource'}) failed: ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readable };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
            <div className="w-11 h-11 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center mb-5">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">{this.state.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.hash = '#/';
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
