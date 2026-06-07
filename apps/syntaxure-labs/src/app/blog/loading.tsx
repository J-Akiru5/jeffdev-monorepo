export default function BlogLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-12">
          <div className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-4 h-10 w-64 animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-4 h-6 w-96 animate-pulse rounded bg-white/[0.04]" />
        </div>

        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-24 animate-pulse rounded bg-white/[0.04]" />
                <div className="h-4 w-4 animate-pulse rounded bg-white/[0.04]" />
                <div className="h-4 w-20 animate-pulse rounded bg-white/[0.04]" />
              </div>
              <div className="mt-3 h-6 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-white/[0.04]" />
              <div className="mt-4 flex gap-2">
                <div className="h-5 w-16 animate-pulse rounded-full bg-white/[0.04]" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
