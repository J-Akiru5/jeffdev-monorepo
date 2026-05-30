import React from "react";
import { cn } from "./utils";

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContainer ensures consistent max-widths and responsive padding 
 * across all dashboard pages. It prevents content from stretching too wide 
 * on large displays while maintaining breathing room on smaller screens.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl", className)}>
      {children}
    </div>
  );
}
