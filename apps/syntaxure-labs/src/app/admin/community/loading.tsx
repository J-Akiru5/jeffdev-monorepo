import { SkeletonBackLink, SkeletonPageHeader, SkeletonCard } from "@syntaxure/ui";

export default function AdminCommunityLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <SkeletonBackLink />

      <SkeletonPageHeader
        titleWidth="w-56"
        subtitleWidth="w-28"
        action
        actionWidth="w-32"
      />

      {/* Release Cards */}
      <div className="mt-8 grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard
            key={i}
            titleWidth="w-52"
            descriptionLines={2}
            status
            footerItems={3}
          />
        ))}
      </div>
    </div>
  );
}
