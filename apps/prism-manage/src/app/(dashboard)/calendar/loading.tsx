import { Skeleton, SkeletonPageHeader } from "@syntaxure/ui";

export default function CalendarLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
      <SkeletonPageHeader
        titleWidth="w-36"
        subtitleWidth="w-56"
        action={false}
      />

      {/* Calendar Placeholder */}
      <div className="rounded-xl border border-glass-10 bg-elevated/30 p-4">
        {/* Calendar Header Toolbar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
          <Skeleton className="h-6 w-36" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>

        {/* Calendar Grid — weekday headers + rows */}
        <div className="space-y-1">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>

          {/* Calendar rows */}
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, dayIdx) => (
                <div
                  key={dayIdx}
                  className="min-h-[80px] rounded border border-glass-05 bg-glass-04 p-1"
                >
                  <Skeleton className="h-4 w-5 mb-1" />
                  <Skeleton className="h-3 w-full rounded-sm" />
                  <Skeleton className="mt-0.5 h-3 w-3/4 rounded-sm" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Sync Status */}
      <div className="flex items-center justify-between rounded-lg border border-glass-10 bg-elevated/30 p-4">
        <div>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-1 h-3 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
