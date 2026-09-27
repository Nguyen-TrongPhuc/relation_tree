'use client';
import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center p-4 bg-red-50 text-red-900 flex-col gap-4">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <pre className="text-sm bg-white p-4 rounded-xl border border-red-200 shadow overflow-auto w-full max-w-2xl">{this.state.error?.message}</pre>
          <pre className="text-xs bg-white p-4 rounded-xl border border-red-200 shadow overflow-auto w-full max-w-2xl opacity-75">{this.state.error?.stack}</pre>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-lg">Tải lại trang</button>
        </div>
      );
    }
    return this.props.children;
  }
}
