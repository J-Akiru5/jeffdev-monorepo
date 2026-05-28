import { Skeleton, SkeletonPageHeader } from "@syntaxure/ui";

export default function KanbanLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
      <SkeletonPageHeader
        titleWidth="w-44"
        subtitleWidth="w-52"
        action={false}
      />

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, colIdx) => (
          <div
            key={colIdx}
            className="min-h-[400px] rounded-xl border border-glass-10 bg-elevated/30 p-4"
          >
            {/* Column Header */}
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-4 w-5" />
            </div>

            {/* Task Cards */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, taskIdx) => (
                <div
                  key={taskIdx}
                  className="rounded-lg border border-glass-05 bg-glass-04 p-3"
                >
                  <div className="flex items-start gap-2">
                    <Skeleton className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add task placeholder */}
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-glass-10 p-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
