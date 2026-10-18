"use client";

import { ErrorReporter } from "@/components/error-reporter";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <ErrorReporter error={error} />
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold text-white">
          Unable to load Operations
        </h2>
        <p className="mt-1 text-sm text-white/40">
          {error.message || "Something went wrong."}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm text-white/70 transition-colors hover:border-border-active"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
