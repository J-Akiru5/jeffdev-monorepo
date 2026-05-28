export default function AgencyLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-white/5" />
      <div className="h-4 w-64 rounded bg-white/5" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="h-8 w-8 rounded-md bg-white/5" />
              <div className="h-3 w-12 rounded bg-white/5" />
            </div>
            <div className="h-8 w-16 rounded bg-white/5 mb-1" />
            <div className="h-3 w-24 rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-3 w-16 rounded bg-white/5" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex-1">
                <div className="h-3 w-40 rounded bg-white/5 mb-1" />
                <div className="h-2 w-24 rounded bg-white/5" />
              </div>
              <div className="h-3 w-14 rounded bg-white/5" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6">
          <div className="h-4 w-32 rounded bg-white/5 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-3">
              <div className="h-2 w-2 rounded-full bg-white/5 mt-1" />
              <div className="flex-1">
                <div className="h-3 w-36 rounded bg-white/5 mb-1" />
                <div className="h-2 w-20 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
