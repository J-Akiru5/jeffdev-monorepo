"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * @component Button
 * @description A "Ghost Glow" button adhering to the JeffDev / Syntaxure Visual Constitution.
 * Uses Headless logic (Radix UI Slot) for accessibility, Tailwind CSS for the stealth luxury "Void" aesthetic,
 * and CVA for type-safe variants and tactile micro-animations.
 *
 * @example
 * <Button variant="primary" onClick={execute}>
 *   Deploy Engine
 * </Button>
 *
 * <Button variant="holographic" size="lg">
 *   Execute_
 * </Button>
 *
 * <Button variant="ghost" asChild>
 *   <Link href="/rules">View Rules</Link>
 * </Button>
 *
 * @param {boolean} [asChild=false] - Render as a child element (e.g. Next.js Link) using Radix Slot.
 * @param {boolean} [isLoading=false] - Triggers loading spinner and disables interactive states.
 * @param {string} [loadingText] - Optional accessible label during loading state.
 * @param {React.ReactNode} [leftIcon] - Leading icon element.
 * @param {React.ReactNode} [rightIcon] - Trailing icon element.
 */
const buttonVariants = cva(
  [
    // Core base geometry & layout (Precision: rounded-md, no rounded-xl/2xl)
    "group relative inline-flex items-center justify-center gap-2",
    "overflow-hidden rounded-md font-medium select-none",
    "transition-all duration-200 ease-out",
    // Focus ring & accessibility
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
    // Disabled state
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    // Tactical tactile feedback (Instant response mandate)
    "active:scale-95",
  ],
  {
    variants: {
      variant: {
        // Primary: High contrast in light mode, Stealth Luxury Ghost Glow in dark mode
        primary: [
          // Light mode: Crisp solid blue/slate with high contrast
          "bg-blue-600 border border-blue-600 text-white shadow-sm",
          "hover:bg-blue-700 hover:border-blue-700 hover:shadow-[0_4px_16px_rgba(37,99,235,0.3)]",
          // Dark mode: Void base with subtle border and cyan glow
          "dark:border-[var(--border-subtle)] dark:bg-black/50 dark:text-white dark:backdrop-blur-md",
          "dark:hover:border-cyan-500/40 dark:hover:bg-black/70",
          "dark:hover:shadow-[0_0_20px_rgba(6,182,212,0.18)]",
          // Dark mode hover aura
          "before:absolute before:inset-0 before:-z-10",
          "before:bg-gradient-to-r before:from-cyan-500/15 before:to-purple-500/15",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "dark:hover:before:opacity-100",
        ],

        // Holographic: Signature JeffDev Ghost Glow Void button with holographic gradient glow
        holographic: [
          "border border-white/10 bg-black/40 text-white backdrop-blur-md",
          "hover:border-white/25 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]",
          "dark:border-white/10 dark:bg-black/50 dark:text-white",
          "dark:hover:border-cyan-500/50",
          // Holographic internal gradient aura
          "before:absolute before:inset-0 before:-z-10",
          "before:bg-gradient-to-r before:from-cyan-500/20 before:via-purple-500/20 before:to-cyan-500/20",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "hover:before:opacity-100",
        ],

        // Secondary: Subtle glass panel
        secondary: [
          "border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)]",
          "hover:border-[var(--border-active)] hover:bg-[var(--bg-tertiary)]",
          "dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-200",
          "dark:hover:border-white/20 dark:hover:bg-white/[0.06] dark:hover:text-white",
        ],

        // Ghost: Borderless void with subtle hover surface
        ghost: [
          "border border-transparent bg-transparent text-[var(--text-secondary)]",
          "hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]",
          "dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
        ],

        // Outline: Precision wireframe
        outline: [
          "border border-[var(--border-active)] bg-transparent text-[var(--text-primary)]",
          "hover:border-[var(--border-glow)] hover:bg-[var(--border-subtle)]",
          "dark:border-white/15 dark:text-zinc-200 dark:hover:border-white/30 dark:hover:bg-white/[0.04] dark:hover:text-white",
        ],

        // Cyan: Technical / Info accent
        cyan: [
          "border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
          "hover:border-cyan-500/60 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]",
        ],

        // Emerald: Status / Online / Success accent
        emerald: [
          "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          "hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]",
        ],

        // Danger: Critical / Destructive accent
        danger: [
          "border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
          "hover:border-red-500/60 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]",
        ],
      },

      size: {
        xs: "h-7 px-2.5 text-xs font-mono tracking-tight",
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base font-medium",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-xs": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child element (for Next.js Link or custom router elements) */
  asChild?: boolean;
  /** Show animated loading spinner and disable interactions */
  isLoading?: boolean;
  /** Custom text to display alongside spinner when loading */
  loadingText?: string;
  /** Optional leading icon element */
  leftIcon?: React.ReactNode;
  /** Optional trailing icon element */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;

    let content: React.ReactNode = children;

    if (isLoading) {
      content = (
        <>
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{loadingText ?? (typeof children === "string" ? children : "Loading...")}</span>
        </>
      );
    } else if (leftIcon || rightIcon) {
      content = (
        <>
          {leftIcon && <span className="inline-flex shrink-0 items-center justify-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0 items-center justify-center">{rightIcon}</span>}
        </>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading ? true : undefined}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
