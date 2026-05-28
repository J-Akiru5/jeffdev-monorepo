import { Skeleton, SkeletonPageHeader } from "@syntaxure/ui";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
      <SkeletonPageHeader
        titleWidth="w-32"
        subtitleWidth="w-56"
        action={false}
      />

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="rounded-xl border border-glass-10 bg-elevated/30 p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-1 h-3 w-48" />
              <div className="mt-4 space-y-3">
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Members Section */}
        <div className="rounded-xl border border-glass-10 bg-elevated/30 p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-1 h-3 w-36" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="rounded-xl border border-glass-10 bg-elevated/30 p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-1 h-3 w-40" />
              <div className="mt-4 flex gap-3">
                <Skeleton className="h-16 w-28 rounded-lg" />
                <Skeleton className="h-16 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Google Calendar Section */}
        <div className="rounded-xl border border-glass-10 bg-elevated/30 p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-1 h-3 w-52" />
              <Skeleton className="mt-4 h-16 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Sync Section */}
        <div className="rounded-xl border border-glass-10 bg-elevated/30 p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-1 h-3 w-48" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
