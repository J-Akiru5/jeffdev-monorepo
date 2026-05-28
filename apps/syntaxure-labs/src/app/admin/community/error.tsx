"use client";

export default function AdminCommunityError({
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
        <p className="mb-6 text-sm text-white/50">
          {error.message ||
            "An unexpected error occurred while loading community releases."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/[0.08]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
