"use client";

/**
 * @component Skeleton
 * @description Loading placeholder with pulse animation.
 * Use for loading states, streaming, and suspense fallbacks.
 *
 * @example
 * <Skeleton className="h-4 w-32" />
 * <Skeleton variant="text" />
 * <Skeleton variant="card" className="p-4" />
 */

import { cn } from "./utils";

interface SkeletonProps {
  /** Additional classes for sizing, etc. */
  className?: string;
  /** Pre-set variants for common use cases */
  variant?: "text" | "title" | "avatar" | "card" | "table-row";
}

// ─── Shared SkeletonSection Components ────────────────────────────────

/**
 * @component SkeletonBackLink
 * @description A back-link navigation skeleton.
 * @example <SkeletonBackLink />
 */
export function SkeletonBackLink({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-32", className)} />;
}

SkeletonBackLink.displayName = "SkeletonBackLink";

interface SkeletonPageHeaderProps {
  /** Tailwind width class for the title, e.g. "w-48", "w-40" */
  titleWidth?: string;
  /** Tailwind width class for the subtitle, e.g. "w-32", "w-56" */
  subtitleWidth?: string;
  /** Show subtitle skeleton */
  subtitle?: boolean;
  /** Show an action button skeleton on the right */
  action?: boolean;
  /** Tailwind width class for the action button */
  actionWidth?: string;
  /** Additional classes for the outer wrapper */
  className?: string;
}

/**
 * @component SkeletonPageHeader
 * @description Page title + optional subtitle + optional action button skeleton.
 * @example
 * // With action button:
 * <SkeletonPageHeader titleWidth="w-44" subtitleWidth="w-28" action />
 * // Without action:
 * <SkeletonPageHeader titleWidth="w-36" subtitleWidth="w-56" action={false} />
 */
export function SkeletonPageHeader({
  titleWidth = "w-48",
  subtitleWidth = "w-32",
  subtitle = true,
  action = true,
  actionWidth = "w-32",
  className,
}: SkeletonPageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <Skeleton className={cn("h-7", titleWidth)} />
        {subtitle && (
          <Skeleton className={cn("mt-1 h-4", subtitleWidth)} />
        )}
      </div>
      {action && (
        <Skeleton className={cn("h-9 rounded-lg", actionWidth)} />
      )}
    </div>
  );
}

SkeletonPageHeader.displayName = "SkeletonPageHeader";

interface SkeletonStatsGridProps {
  /** Number of stat cards to render */
  count?: number;
  /** Number of columns on sm+ screens */
  cols?: 2 | 3 | 4;
  /** Additional classes for each card */
  cardClassName?: string;
  /** Additional classes for the grid container */
  className?: string;
}

/**
 * @component SkeletonStatsGrid
 * @description A responsive grid of stat-card skeletons.
 * @example <SkeletonStatsGrid count={4} cols={4} />
 */
export function SkeletonStatsGrid({
  count = 4,
  cols = 4,
  cardClassName,
  className,
}: SkeletonStatsGridProps) {
  const colClasses: Record<number, string> = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
  };

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4",
        colClasses[cols],
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-md border border-white/[0.08] bg-white/[0.02] p-4",
            cardClassName,
          )}
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-1 h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

SkeletonStatsGrid.displayName = "SkeletonStatsGrid";

interface SkeletonCardProps {
  /** Tailwind width class for the title */
  titleWidth?: string;
  /** Show a status badge skeleton on the right */
  status?: boolean;
  /** Number of description lines */
  descriptionLines?: number;
  /** Number of footer metadata items */
  footerItems?: number;
  /** Additional classes for the card */
  className?: string;
}

/**
 * @component SkeletonCard
 * @description A card skeleton with title, description lines, optional status badge, and optional footer metadata items.
 * @example
 * <SkeletonCard titleWidth="w-52" descriptionLines={2} status footerItems={3} />
 */
export function SkeletonCard({
  titleWidth = "w-48",
  status = true,
  descriptionLines = 2,
  footerItems = 3,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-white/[0.08] bg-white/[0.02] p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className={cn("h-5", titleWidth)} />
          {Array.from({ length: descriptionLines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "mt-2 h-3",
                i === 0 ? "w-full max-w-md" : "w-3/4",
              )}
            />
          ))}
        </div>
        {status && <Skeleton className="h-6 w-20 flex-shrink-0 rounded-full" />}
      </div>
      {footerItems > 0 && (
        <div className="mt-4 flex items-center gap-4">
          {Array.from({ length: footerItems }).map((_, i) => {
            const widths = ["w-24", "w-20", "w-16"];
            return (
              <Skeleton
                key={i}
                className={cn("h-3", widths[i % widths.length])}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

SkeletonCard.displayName = "SkeletonCard";

// ─── Original Skeleton ────────────────────────────────────────────────

export function Skeleton({ className, variant }: SkeletonProps) {
  if (variant === "text") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="h-3 w-full animate-pulse rounded bg-white/5" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-4/6 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  if (variant === "title") {
    return (
      <div className={cn("h-5 w-48 animate-pulse rounded bg-white/5", className)} />
    );
  }

  if (variant === "avatar") {
    return (
      <div
        className={cn(
          "h-10 w-10 animate-pulse rounded-full bg-white/5",
          className,
        )}
      />
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "space-y-3 rounded-md border border-white/5 bg-white/[0.02] p-4",
          className,
        )}
      >
        <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-full animate-pulse rounded bg-white/5" />
        <div className="h-3 w-4/6 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  if (variant === "table-row") {
    return (
      <div className={cn("flex items-center gap-4 px-4 py-3", className)}>
        <div className="h-8 w-8 animate-pulse rounded-full bg-white/5" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-3/6 animate-pulse rounded bg-white/5" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-white/5" />
        </div>
        <div className="h-6 w-16 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  return (
    <div
      className={cn("animate-pulse rounded bg-white/5", className)}
    />
  );
}

/**
 * @component SkeletonTable
 * @description Pre-built skeleton for data tables with configurable rows/columns.
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0 overflow-hidden rounded-md border border-white/5 bg-white/[0.02]", className)}>
      {/* Header */}
      <div className="flex gap-4 border-b border-white/5 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded bg-white/5"
            style={{ width: `${Math.max(60, 100 / columns)}%` }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 border-b border-white/5 px-4 py-3"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-3 animate-pulse rounded bg-white/5"
              style={{
                width: `${Math.max(60, 100 / columns)}%`,
                opacity: Math.max(0.3, 1 - rowIdx * 0.12),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
