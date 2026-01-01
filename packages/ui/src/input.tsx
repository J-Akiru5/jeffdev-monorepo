"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * @component Input
 * @description JeffDev styled input with bottom border focus pattern.
 * Uses JetBrains Mono for user input as per Design System.
 *
 * @example
 * <Input placeholder="Enter rule name..." />
 * <Input variant="glass" label="Email" />
 */

const inputVariants = cva(
  [
    "flex w-full rounded-md px-3 py-2",
    "font-mono text-sm text-white placeholder:text-white/30",
    "outline-none transition-all duration-200",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        // Default: minimal with bottom focus
        default: [
          "border-b border-white/10 bg-transparent",
          "focus:border-cyan-500",
        ],
        // Glass: full border glass panel
        glass: [
          "border border-white/10 bg-white/5",
          "focus:border-white/20 focus:bg-white/8",
        ],
        // Ghost: no border until focus
        ghost: [
          "bg-transparent",
          "focus:bg-white/5",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Optional label above input */
  label?: string;
  /** Error message */
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, label, error, type, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wider text-white/50"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            inputVariants({ variant }),
            error && "border-red-500/50 focus:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
