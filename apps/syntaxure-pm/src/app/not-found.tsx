import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/10">
          <span className="text-4xl font-bold text-violet-400">404</span>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">
          Page not found
        </h2>
        <p className="mb-6 text-sm text-zinc-400">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/30 px-5 py-2.5 text-sm font-medium text-violet-400 transition-all hover:bg-violet-500/20"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
