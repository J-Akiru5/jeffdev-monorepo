"use client";

import * as React from "react";
import { cn } from "./utils";
import { Button } from "./button";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  kicker?: string;
  action?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
}

export function SectionHeader({
  className,
  title,
  description,
  kicker,
  action,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between mb-6", className)} {...props}>
      <div>
        {kicker && (
          <div className="flex items-center gap-2 mb-2">
            <span className="h-px w-4 bg-cyan-500/50" />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              {kicker}
            </span>
          </div>
        )}
        <h2 className="text-xl font-semibold text-white tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-white/50 mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex text-xs uppercase tracking-wider"
          onClick={action.onClick}
          asChild={!!action.href}
        >
          {action.href ? (
            <a href={action.href}>
              {action.label} <ArrowRight className="ml-2 h-3 w-3" />
            </a>
          ) : (
            <>
              {action.label} <ArrowRight className="ml-2 h-3 w-3" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
