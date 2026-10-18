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

import { isValidElement, type ReactNode } from "react";
import { cn } from "./utils";

interface EmptyStateProps {
  /**
   * Icon component (lucide-react) — or a pre-rendered element when used from
   * a server component (component functions can't cross the RSC boundary).
   */
  icon?: React.ComponentType<{ className?: string }> | ReactNode;
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
  icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  const iconIsElement = isValidElement(icon);
  const Icon =
    !iconIsElement && icon && typeof icon !== "string"
      ? (icon as React.ComponentType<{ className?: string }>)
      : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8" : "py-16",
        className,
      )}
    >
      {(Icon || iconIsElement) && (
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03]",
            compact ? "h-10 w-10" : "h-14 w-14",
          )}
        >
          {iconIsElement ? (
            icon
          ) : Icon ? (
            <Icon
              className={cn(
                "text-white/20",
                compact ? "h-5 w-5" : "h-7 w-7",
              )}
            />
          ) : null}
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
