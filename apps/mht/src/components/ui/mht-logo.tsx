'use client';

import clsx from 'clsx';

interface MHTLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  variant?: 'color' | 'white';
}

/**
 * @component MHTLogo
 * @description Martinez Hybrid Technologies logomark.
 * Abstract geometric "M" with integrated circuit/solar motifs.
 * Gradient: Corporate Blue → Vibrant Green (hybrid identity).
 */
export function MHTLogo({ className, variant = 'color', ...props }: MHTLogoProps) {
  const gradientId = `mht-grad-${variant}`;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(className)}
      aria-label="Martinez Hybrid Technologies"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={variant === 'white' ? '#ffffff' : '#2563eb'} />
          <stop offset="50%" stopColor={variant === 'white' ? '#ffffff' : '#059669'} />
          <stop offset="100%" stopColor={variant === 'white' ? '#ffffff' : '#22c55e'} />
        </linearGradient>
      </defs>

      {/* Left pillar of M */}
      <polygon
        points="10,85 10,20 25,20 25,60 30,50 25,85"
        fill={`url(#${gradientId})`}
      />

      {/* Center V of M */}
      <polygon
        points="25,20 50,65 75,20 65,20 50,50 35,20"
        fill={`url(#${gradientId})`}
      />

      {/* Right pillar of M */}
      <polygon
        points="75,20 90,20 90,85 75,85 75,60 70,50"
        fill={`url(#${gradientId})`}
      />

      {/* Solar ray accent (top-right) */}
      <circle cx="82" cy="12" r="4" fill={variant === 'white' ? '#ffffff' : '#22c55e'} opacity="0.8" />
      <line x1="82" y1="4" x2="82" y2="1" stroke={variant === 'white' ? '#ffffff' : '#22c55e'} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="88" y1="6" x2="91" y2="4" stroke={variant === 'white' ? '#ffffff' : '#22c55e'} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="90" y1="12" x2="93" y2="12" stroke={variant === 'white' ? '#ffffff' : '#22c55e'} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Network node accent (bottom-left) */}
      <circle cx="15" cy="92" r="2.5" fill={variant === 'white' ? '#ffffff' : '#2563eb'} opacity="0.7" />
      <line x1="17" y1="90" x2="25" y2="88" stroke={variant === 'white' ? '#ffffff' : '#2563eb'} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <circle cx="27" cy="88" r="1.5" fill={variant === 'white' ? '#ffffff' : '#2563eb'} opacity="0.5" />
    </svg>
  );
}

export default MHTLogo;
