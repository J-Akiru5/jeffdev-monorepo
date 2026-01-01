'use client';

/**
 * Progress Bar Component
 * -----------------------
 * Animated progress bar with gradient fill.
 */

interface ProgressBarProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ProgressBar({ value, size = 'md', showLabel = true }: ProgressBarProps) {
  const height = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 overflow-hidden rounded-full bg-white/10 ${height}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-sm text-white/50">{clampedValue}%</span>
      )}
    </div>
  );
}
