"use client";

import * as React from "react";
import { cn } from "./utils";

interface GridBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "neon";
}

export function GridBackground({ className, variant = "default", ...props }: GridBackgroundProps) {
  return (
    <div 
      className={cn(
        "fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none",
        className
      )} 
      {...props}
    >
      {/* Grid Pattern (matches marketing hero) */}
      <div 
        className="absolute inset-0 opacity-60 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,_#000_70%,_transparent_100%)]"
      />

      {/* Spotlight / Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/35 to-[#050505]" />
      
      {/* Top Glow */}
      {variant === "neon" && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/16 blur-[140px] rounded-full opacity-80" />
      )}
    </div>
  );
}
