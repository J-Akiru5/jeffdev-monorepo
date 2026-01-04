import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const metricTileVariants = cva(
  "group relative overflow-hidden rounded-lg border border-white/[0.05] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]",
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
  }
);

type IconType = React.ComponentType<{ className?: string }>;

export interface MetricTileProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof metricTileVariants> {
  label: string;
  value: string | number;
  icon?: IconType;
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
  icon: Icon,
  trend,
  href,
  ...props
}: MetricTileProps) {
  const Content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-white/40 transition-colors group-hover:bg-white/10 group-hover:text-white">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-2xl font-semibold text-white tracking-tight font-mono">
          {value}
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-mono",
            trend.direction === "up" && "text-emerald-400",
            trend.direction === "down" && "text-red-400",
            trend.direction === "neutral" && "text-white/40"
          )}>
            {trend.direction === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trend.direction === "down" && <ArrowDownRight className="h-3 w-3" />}
            {trend.direction === "neutral" && <Minus className="h-3 w-3" />}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Hover Beam Effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(metricTileVariants({ intent, className }))}
      >
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
