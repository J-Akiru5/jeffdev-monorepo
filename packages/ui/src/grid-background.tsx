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
        "absolute inset-0 -z-50 overflow-hidden pointer-events-none select-none",
        className
      )} 
      {...props}
    >
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
        style={{
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)"
        }}
      />
      
      {/* Spotlight / Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
      
      {/* Top Glow */}
      {variant === "neon" && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full opacity-50" />
      )}
    </div>
  );
}
