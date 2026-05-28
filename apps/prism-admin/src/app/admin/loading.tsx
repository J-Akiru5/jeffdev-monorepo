export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-white/5" />
      <div className="h-4 w-64 rounded bg-white/5" />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div className="h-3 w-20 rounded bg-white/5 mb-3" />
            <div className="h-8 w-16 rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 rounded bg-white/5" />
          <div className="h-3 w-16 rounded bg-white/5" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
            <div className="h-8 w-8 rounded-full bg-white/5" />
            <div className="flex-1">
              <div className="h-3 w-32 rounded bg-white/5 mb-1" />
              <div className="h-2 w-24 rounded bg-white/5" />
            </div>
            <div className="h-3 w-12 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
