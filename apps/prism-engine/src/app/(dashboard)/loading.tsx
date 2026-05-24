/**
 * Dashboard Loading Skeleton
 * Shows a loading state while server components are streaming.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="h-6 w-32 rounded-full bg-white/5" />
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-10 w-48 rounded bg-white/5" />
            <div className="h-5 w-72 rounded bg-white/5" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 rounded-md bg-white/5" />
            <div className="h-10 w-36 rounded-md bg-white/5" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-md border border-white/5 bg-white/[0.02] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-white/5" />
              <div className="h-4 w-4 rounded bg-white/5" />
            </div>
            <div className="h-8 w-16 rounded bg-white/5" />
            <div className="h-3 w-20 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Usage Card */}
      <div className="rounded-md border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <div className="h-5 w-32 rounded bg-white/5" />
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-3/4 rounded bg-white/5" />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <div className="h-10 w-10 rounded-lg bg-white/5" />
            <div className="h-5 w-32 rounded bg-white/5" />
            <div className="h-4 w-48 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-4 w-16 rounded bg-white/5" />
            <div className="h-5 w-28 rounded bg-white/5" />
          </div>
          <div className="h-4 w-20 rounded bg-white/5" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-md border border-white/5 bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded bg-white/5" />
                <div className="h-5 w-12 rounded-full bg-white/5" />
              </div>
              <div className="h-5 w-36 rounded bg-white/5" />
              <div className="h-4 w-48 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
