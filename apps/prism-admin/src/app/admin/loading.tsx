import { Skeleton, SkeletonTable } from "@syntaxure/ui";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-amber-500/5 p-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="mt-3 h-4 w-32" />
          <Skeleton className="mt-1 h-3 w-48" />
        </div>
        <div className="rounded-lg border border-white/5 bg-amber-500/5 p-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="mt-3 h-4 w-32" />
          <Skeleton className="mt-1 h-3 w-48" />
        </div>
      </div>

      {/* Recent Users Table */}
      <div>
        <Skeleton className="h-5 w-28" />
        <div className="mt-3">
          <SkeletonTable rows={4} columns={3} />
        </div>
      </div>
    </div>
  );
}
