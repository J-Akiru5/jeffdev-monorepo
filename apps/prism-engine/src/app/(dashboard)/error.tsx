"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-white/50">
            An error occurred while loading this page. Try refreshing.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs font-mono text-white/30">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
