import { Skeleton, SkeletonPageHeader } from "@syntaxure/ui";

export default function MarketingLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
      <SkeletonPageHeader
        titleWidth="w-52"
        subtitleWidth="w-64"
        action={false}
      />

      {/* KPI Cards */}
      <section className="mb-8">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-lg p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-32" />
            </div>
          ))}
        </div>
      </section>

      {/* Phase Progress */}
      <section className="mb-8">
        <Skeleton className="mb-4 h-4 w-28" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Status Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-lg p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-8 w-12" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
