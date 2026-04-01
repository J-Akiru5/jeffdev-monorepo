'use client';

import React from 'react';
import { cn } from '@jdstudio/ui';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  accent?: 'blue' | 'green' | 'none';
  hover?: boolean;
}

/**
 * @component GlassCard
 * @description Enterprise White Glassmorphism card for MHT.
 * Overrides the dark-mode GlassPanel from packages/ui.
 */
export function GlassCard({
  className,
  children,
  accent = 'none',
  hover = true,
  ...props
}: GlassCardProps) {
  const accentBorder = {
    blue: 'border-t-2 border-t-blue-500',
    green: 'border-t-2 border-t-green-500',
    none: '',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        'bg-white/65 backdrop-blur-xl',
        'border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.06)]',
        hover && 'transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:translate-y-[-2px]',
        accentBorder[accent],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
