"use client";

/**
 * @component ProgressBar
 * @description Animated progress bar with gradient fill.
 * Extracted from apps/agency with minor refinements.
 *
 * @example
 * <ProgressBar value={75} />
 * <ProgressBar value={30} size="lg" showLabel={false} />
 */

import { cn } from "./utils";

interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show percentage label */
  showLabel?: boolean;
  /** Additional classes */
  className?: string;
}

export function ProgressBar({
  value,
  size = "md",
  showLabel = true,
  className,
}: ProgressBarProps) {
  const height = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  }[size];

  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex-1 overflow-hidden rounded-full bg-white/10", height)}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-sm text-white/50">{clampedValue}%</span>
      )}
    </div>
  );
}
