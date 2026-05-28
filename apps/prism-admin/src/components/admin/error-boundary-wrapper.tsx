"use client";

/**
 * ErrorBoundaryWrapper
 * --------------------
 * Wraps children in an ErrorBoundary with admin-styled fallback UI.
 * Used in admin route layouts to prevent crashes from taking down the sidebar/nav.
 */

import { ErrorBoundary } from "@syntaxure/ui";
import { ShieldAlert, RefreshCw } from "lucide-react";

export function AdminErrorBoundary({
  children,
  label = "this section",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error(`[AdminErrorBoundary/${label}]`, error);
      }}
      fallback={({ error, reset }) => (
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <ShieldAlert className="h-7 w-7 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-red-400">
            Failed to load {label}
          </h3>
          <p className="mt-2 max-w-md text-sm text-white/50">
            {error?.message || "An unexpected error occurred while loading this section."}
          </p>
          <button
            onClick={reset}
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
