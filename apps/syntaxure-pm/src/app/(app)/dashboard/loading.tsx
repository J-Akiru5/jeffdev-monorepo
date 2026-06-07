import {
  SkeletonPageHeader,
  SkeletonStatsGrid,
  Skeleton,
  SkeletonCard,
} from "@syntaxure/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <SkeletonPageHeader titleWidth="w-36" subtitleWidth="w-56" action={false} />

      {/* Progress skeleton */}
      <div className="glass p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-12" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>

      {/* Stats skeleton */}
      <SkeletonStatsGrid count={4} cols={4} />

      {/* Quick links skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} titleWidth="w-36" descriptionLines={2} status={false} footerItems={0} />
        ))}
      </div>

      {/* Deadlines skeleton */}
      <div className="glass p-6">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
