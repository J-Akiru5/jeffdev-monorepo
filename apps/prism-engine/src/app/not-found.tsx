import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <span className="text-2xl font-bold text-cyan-400">404</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Page not found
          </h1>
          <p className="text-sm text-white/50">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
