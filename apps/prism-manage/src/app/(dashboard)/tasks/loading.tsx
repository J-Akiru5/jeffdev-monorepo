import { Skeleton, SkeletonPageHeader, SkeletonTable } from "@syntaxure/ui";

export default function TasksLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
      <SkeletonPageHeader
        titleWidth="w-32"
        subtitleWidth="w-24"
        action
        actionWidth="w-28"
      />

      {/* Task Lists by Project */}
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, projectIdx) => (
          <div key={projectIdx}>
            {/* Project Header */}
            <div className="mb-3 flex items-center gap-3">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>

            {/* Task Table — glass theme overrides */}
            <SkeletonTable
              rows={4}
              columns={5}
              className="border-glass-10 bg-elevated/30"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
