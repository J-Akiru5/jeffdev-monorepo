import { Skeleton, SkeletonBackLink, SkeletonPageHeader, SkeletonStatsGrid, SkeletonTable } from "@syntaxure/ui";

export default function AdminInvoicesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <SkeletonBackLink />

      <SkeletonPageHeader
        titleWidth="w-44"
        subtitleWidth="w-28"
        action
        actionWidth="w-32"
      />

      <SkeletonStatsGrid cols={4} />

      {/* Invoice Groups by Status */}
      <div className="mt-8 space-y-8">
        {Array.from({ length: 3 }).map((_, groupIdx) => (
          <div key={groupIdx}>
            <div className="mb-3 flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-sm" />
              <Skeleton className="h-4 w-8" />
            </div>
            <SkeletonTable rows={3} columns={4} />
          </div>
        ))}
      </div>
    </div>
  );
}
