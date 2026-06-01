"use client";

import Link from "next/link";

export default function DashboardGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <span className="text-2xl text-red-400">!</span>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">
          Something went wrong
        </h2>
        <p className="mb-2 text-sm text-white/40">
          An unexpected error occurred while loading this page. Please try again
          or return to the dashboard.
        </p>
        {error.digest && (
          <p className="mb-6 text-xs font-mono text-white/20">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-glass-10 bg-elevated/50 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-elevated hover:shadow-lg"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white/60 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-white"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
