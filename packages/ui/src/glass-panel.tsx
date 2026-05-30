"use client";

import * as React from "react";
import { cn } from "./utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export function GlassPanel({
  className,
  children,
  hoverEffect = false,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] backdrop-blur-2xl shadow-[inset_0_1px_0_0_var(--border-subtle)]",
        hoverEffect &&
          "transition-all duration-300 hover:border-[var(--border-active)] hover:bg-[var(--bg-tertiary)] hover:shadow-lg hover:shadow-cyan-500/10",
        className,
      )}
      {...props}
    >
      {/* Noise Texture (Optional, kept subtle) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
