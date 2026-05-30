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
        "relative overflow-hidden rounded-xl border border-white/5 bg-black/40 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
        hoverEffect &&
          "transition-all duration-300 hover:border-white/10 hover:bg-black/60 hover:shadow-lg hover:shadow-cyan-500/10",
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
