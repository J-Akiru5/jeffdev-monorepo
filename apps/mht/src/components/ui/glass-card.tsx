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
 * Features Syntaxure-inspired shimmer + accent glow micro-animations.
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

  const accentGlow = {
    blue: 'card-glow-blue',
    green: 'card-glow-green',
    none: '',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        'bg-white/70 backdrop-blur-xl',
        'border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.05)]',
        // Shimmer sweep on hover (CSS-only, via globals.css)
        'card-shimmer',
        hover && [
          'transition-all duration-300',
          'hover:bg-white/80',
          'hover:border-white/90',
          'hover:translate-y-[-2px]',
          'hover:scale-[1.008]',
          'active:scale-[0.998]',
          accentGlow[accent],
        ],
        accentBorder[accent],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
