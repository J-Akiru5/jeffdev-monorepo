import { Skeleton } from "@syntaxure/ui";

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      {/* Profile section skeleton */}
      <div className="glass p-6">
        <Skeleton className="mb-4 h-5 w-20" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>

      {/* Account section skeleton */}
      <div className="glass p-6">
        <Skeleton className="mb-4 h-5 w-20" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance section skeleton */}
      <div className="glass p-6">
        <Skeleton className="mb-4 h-5 w-24" />
        <div className="rounded-lg bg-white/[0.02] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
