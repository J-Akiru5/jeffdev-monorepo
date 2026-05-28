"use client";

export default function AgencyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <span className="text-2xl text-red-400">!</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-white/50 mb-6">
          {error.message || "An unexpected error occurred in the agency section."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition-colors"
        >
          Try again
        </button>
        <a
          href="/admin/agency/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-colors ml-3"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
