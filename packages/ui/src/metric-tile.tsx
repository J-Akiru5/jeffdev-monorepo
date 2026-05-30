"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const metricTileVariants = cva(
  "group relative overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 transition-all duration-300 hover:border-[var(--border-active)] hover:bg-[var(--bg-tertiary)]",
  {
    variants: {
      intent: {
        default: "hover:shadow-glow-cyan/10",
        cyan: "hover:border-cyan-500/30 hover:shadow-glow-cyan",
        purple: "hover:border-purple-500/30 hover:shadow-glow-purple",
      },
    },
    defaultVariants: {
      intent: "default",
    },
  },
);

export interface MetricTileProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricTileVariants> {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    direction: "up" | "down" | "neutral";
  };
  href?: string;
}

export function MetricTile({
  className,
  intent,
  label,
  value,
  icon,
  trend,
  href,
  ...props
}: MetricTileProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="h-4 w-4" />;
  };

  const Content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors group-hover:bg-[var(--border-active)] group-hover:text-[var(--text-primary)]">
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight font-mono">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {value}
          </motion.span>
        </div>

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-mono",
              trend.direction === "up" && "text-emerald-400",
              trend.direction === "down" && "text-red-400",
              trend.direction === "neutral" && "text-[var(--text-tertiary)]",
            )}
          >
            {trend.direction === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trend.direction === "down" && (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trend.direction === "neutral" && <Minus className="h-3 w-3" />}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Hover Beam Effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--border-subtle)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </>
  );

  if (href) {
    return (
      <a href={href} className={cn(metricTileVariants({ intent, className }))}>
        {Content}
      </a>
    );
  }

  return (
    <div className={cn(metricTileVariants({ intent, className }))} {...props}>
      {Content}
    </div>
  );
}
