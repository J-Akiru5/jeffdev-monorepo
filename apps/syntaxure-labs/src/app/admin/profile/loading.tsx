import { Skeleton, SkeletonBackLink, SkeletonPageHeader } from "@syntaxure/ui";

export default function AdminProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <SkeletonBackLink />

      <SkeletonPageHeader
        titleWidth="w-48"
        subtitleWidth="w-64"
        action={false}
      />

      {/* Profile Form Skeleton */}
      <div className="mt-8 max-w-3xl space-y-6">
        {/* Avatar + Name */}
        <div className="flex items-center gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-3 w-56" />
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div>
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Namecard Settings */}
        <div>
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </div>
  );
}
