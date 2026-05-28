"use client";

/**
 * @component EmptyState
 * @description Consistent empty state placeholder for tables, lists, and sections.
 *
 * @example
 * <EmptyState
 *   icon={Inbox}
 *   title="No messages"
 *   description="No messages match your filters."
 *   action={<Button>Create one</Button>}
 * />
 */

import type { ReactNode } from "react";
import { cn } from "./utils";

interface EmptyStateProps {
  /** Icon component (lucide-react icon) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Primary message */
  title: string;
  /** Secondary description */
  description?: string;
  /** Call-to-action button(s) */
  action?: ReactNode;
  /** Additional classes */
  className?: string;
  /** Whether to use compact sizing (for small containers) */
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8" : "py-16",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03]",
            compact ? "h-10 w-10" : "h-14 w-14",
          )}
        >
          <Icon
            className={cn(
              "text-white/20",
              compact ? "h-5 w-5" : "h-7 w-7",
            )}
          />
        </div>
      )}
      <h3
        className={cn(
          "font-semibold text-white/60",
          compact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "mt-1 max-w-xs text-white/40",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
