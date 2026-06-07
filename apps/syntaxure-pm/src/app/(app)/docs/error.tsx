"use client";

export default function DocsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="glass mx-auto max-w-md p-8 text-center">
      <h2 className="text-lg font-semibold text-white">
        Failed to load documentation
      </h2>
      <p className="mt-2 text-sm text-zinc-400">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.08]"
      >
        Try again
      </button>
    </div>
  );
}
