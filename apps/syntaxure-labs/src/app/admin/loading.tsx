import { Skeleton, SkeletonBackLink, SkeletonPageHeader, SkeletonStatsGrid } from "@syntaxure/ui";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <SkeletonBackLink />

      <SkeletonPageHeader
        titleWidth="w-48"
        subtitleWidth="w-32"
        action
        actionWidth="w-32"
      />

      <SkeletonStatsGrid cols={4} />

      {/* List Items */}
      <div className="mt-8 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border border-white/[0.08] bg-white/[0.02] p-4"
          >
            <div className="flex items-center gap-4">
              <div>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1 h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
