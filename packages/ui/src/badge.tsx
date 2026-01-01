"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * @component Badge
 * @description Status indicator / tag component.
 * Uses JetBrains Mono for the "technical data" feel.
 *
 * @example
 * <Badge>Architecture</Badge>
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 */

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-sm px-2 py-0.5",
    "font-mono text-[10px] uppercase tracking-wider",
    "transition-colors",
  ],
  {
    variants: {
      variant: {
        // Default: neutral
        default: "bg-white/10 text-white/60",
        // Semantic colors
        success: "bg-emerald-500/20 text-emerald-400",
        warning: "bg-amber-500/20 text-amber-400",
        danger: "bg-red-500/20 text-red-400",
        info: "bg-cyan-500/20 text-cyan-400",
        // Category badges
        architecture: "bg-purple-500/20 text-purple-400",
        styling: "bg-pink-500/20 text-pink-400",
        security: "bg-orange-500/20 text-orange-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
