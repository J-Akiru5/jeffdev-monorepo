import {
  SkeletonPageHeader,
  Skeleton,
  SkeletonCard,
} from "@syntaxure/ui";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader titleWidth="w-32" subtitleWidth="w-48" action />

      {/* Filters skeleton */}
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-lg" />
        ))}
      </div>

      {/* Board skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((col) => (
          <div key={col} className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <div className="space-y-2">
              {[1, 2].map((card) => (
                <SkeletonCard
                  key={card}
                  titleWidth="w-3/4"
                  descriptionLines={1}
                  status={false}
                  footerItems={2}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
