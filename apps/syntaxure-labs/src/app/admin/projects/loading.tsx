import { Skeleton, SkeletonBackLink, SkeletonPageHeader } from "@syntaxure/ui";

export default function AdminProjectsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <SkeletonBackLink />

      <SkeletonPageHeader
        titleWidth="w-44"
        subtitleWidth="w-28"
        action
        actionWidth="w-32"
      />

      {/* Project Cards */}
      <div className="mt-8 grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-white/[0.08] bg-white/[0.02] p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="mt-2 h-3 w-full max-w-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
