"use client";

/**
 * @component ErrorBoundary
 * @description React error boundary that catches render errors and shows a fallback UI.
 * Wraps a section or page to prevent crashes from taking down the entire UI.
 *
 * @example
 * <ErrorBoundary>
 *   <DashboardCharts />
 * </ErrorBoundary>
 *
 * <ErrorBoundary
 *   fallback={<CustomFallback />}
 *   onError={(error) => logError(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "./utils";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI. Receives the error and a reset function. */
  fallback?: React.ReactNode | ((props: { error: Error; reset: () => void }) => React.ReactNode);
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Additional classes for the fallback container */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return (
            <>{this.props.fallback({ error: this.state.error!, reset: this.handleReset })}</>
          );
        }
        return <>{this.props.fallback}</>;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

// ── Default Fallback UI ─────────────────────────────────────────────────────

function DefaultErrorFallback({
  error,
  onReset,
  className,
}: {
  error: Error | null;
  onReset: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-red-500/20 bg-red-500/5 p-8 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <h3 className="text-sm font-semibold text-red-400">
        Something went wrong
      </h3>
      <p className="mt-1 max-w-md text-xs text-white/50">
        {error?.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={onReset}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <RefreshCw className="h-3 w-3" />
        Try again
      </button>
    </div>
  );
}
