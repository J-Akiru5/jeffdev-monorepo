"use client";

import React, { useState, MouseEvent } from "react";
import { cn } from "./utils";

export function HoverCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn("group relative overflow-hidden", className)}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(6,182,212,0.12), transparent 40%)`,
        }}
      />
      <div className="relative z-10 w-full h-full flex flex-col">{children}</div>
    </div>
  );
}
