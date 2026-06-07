"use client";

export default function DashboardError({
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
          Unable to load dashboard
        </h2>
        <p className="mb-6 text-sm text-zinc-400">
          {error.message || "Something went wrong while loading the dashboard. Please try again."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/30 px-5 py-2.5 text-sm font-medium text-violet-400 transition-all hover:bg-violet-500/20"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
