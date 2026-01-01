"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * @component Button
 * @description Ghost Glow button following JeffDev Design System.
 * Uses Headless logic (Radix Slot) + Tailwind styling + CVA variants.
 *
 * @example
 * <Button variant="primary" size="md">Deploy Engine</Button>
 * <Button variant="ghost" asChild><Link href="/rules">View Rules</Link></Button>
 */

const buttonVariants = cva(
  // Base styles - applies to all variants
  [
    "group relative inline-flex items-center justify-center gap-2",
    "overflow-hidden rounded-md font-medium",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        // Primary: Ghost Glow pattern
        primary: [
          "border border-white/10 bg-black/20 backdrop-blur-sm",
          "text-white",
          "hover:border-white/20 hover:bg-black/30",
          // Inner glow on hover
          "before:absolute before:inset-0 before:-z-10",
          "before:bg-gradient-to-r before:from-cyan-500/10 before:to-purple-500/10",
          "before:opacity-0 before:transition-opacity",
          "hover:before:opacity-100",
        ],
        // Secondary: Subtle glass
        secondary: [
          "border border-white/8 bg-white/5",
          "text-white/70",
          "hover:border-white/15 hover:bg-white/8 hover:text-white",
        ],
        // Ghost: No border, just hover effect
        ghost: [
          "text-white/60",
          "hover:bg-white/5 hover:text-white",
        ],
        // Danger: Red accent
        danger: [
          "border border-red-500/30 bg-red-500/10",
          "text-red-400",
          "hover:border-red-500/50 hover:bg-red-500/20",
        ],
        // Cyan accent (for CTAs)
        cyan: [
          "border border-cyan-500/30 bg-cyan-500/10",
          "text-cyan-400",
          "hover:border-cyan-500/50 hover:bg-cyan-500/20",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  /** Render as child element (for Link components) */
  asChild?: boolean;
  /** Show loading spinner */
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
