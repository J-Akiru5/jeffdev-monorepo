"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * @component Card
 * @description Glass Panel card component following JeffDev Design System.
 * Provides the "Void" aesthetic with subtle glass morphism.
 *
 * @example
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Rule Details</CardTitle>
 *     <CardDescription>View and edit this rule</CardDescription>
 *   </CardHeader>
 *   <CardContent>...</CardContent>
 *   <CardFooter>...</CardFooter>
 * </Card>
 */

const cardVariants = cva(
  [
    "rounded-md border",
    "transition-all duration-200",
  ],
  {
    variants: {
      variant: {
        // Default glass panel
        default: [
          "border-white/[0.05] bg-white/[0.02]",
          "hover:border-white/[0.08]",
        ],
        // Elevated with more opacity
        elevated: [
          "border-white/[0.08] bg-white/[0.04]",
          "shadow-lg shadow-black/20",
        ],
        // Interactive (for clickable cards)
        interactive: [
          "border-white/[0.05] bg-white/[0.02]",
          "cursor-pointer",
          "hover:border-white/[0.12] hover:bg-white/[0.04]",
          "active:scale-[0.99]",
        ],
        // Highlighted (for featured items)
        highlighted: [
          "border-cyan-500/20 bg-cyan-500/5",
          "hover:border-cyan-500/30",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> { }

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/50", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
