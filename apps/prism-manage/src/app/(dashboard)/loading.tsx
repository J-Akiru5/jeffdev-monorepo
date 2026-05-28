import { Skeleton, SkeletonPageHeader, SkeletonStatsGrid } from "@syntaxure/ui";

export default function DashboardGroupLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
      {/* Page Header */}
      <div className="mb-10">
        <SkeletonPageHeader
          titleWidth="w-48"
          subtitleWidth="w-32"
          action={false}
        />

        {/* Stats Grid */}
        <div className="mt-6">
          <SkeletonStatsGrid
            count={4}
            cols={4}
            cardClassName="rounded-xl border border-glass-10 bg-elevated/50"
          />
        </div>
      </div>

      {/* Departments Section */}
      <section>
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-glass-10 bg-elevated/30 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="mt-2 h-3 w-36" />
              <Skeleton className="mt-3 h-3 w-20" />
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions (visible to founders) */}
      <section className="mt-10">
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-36 rounded-lg" />
          ))}
        </div>
      </section>
    </div>
  );
}
