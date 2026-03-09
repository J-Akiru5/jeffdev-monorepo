'use client';

import clsx from 'clsx';

interface SyntaxureLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * @component SyntaxureLogo
 * @description
 * The Syntaxure Labs brand mark, precisely recreated from the reference PNG.
 *
 * Geometry (100x100 viewBox):
 * - SLIVER (upper-right, elevated): flat top at y=5, sharp vertex at lower-left (y=73)
 * - MAIN BODY (lower-left): flat bottom at y=95, sharp vertex at upper-right (y=25)
 * - Gap between them: ~14 units perpendicular spacing (clearly visible at any size)
 * - Both share the same cyan→blue→purple gradient
 * - Double-layer glow filter replicates the raster bloom effect from the PNG
 */
export function SyntaxureLogo({ className, ...props }: SyntaxureLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(className)}
      aria-label="Syntaxure Labs"
      role="img"
      {...props}
    >
      <defs>
        {/* Cyan → Royal Blue → Deep Purple — matches the reference PNG colour sweep */}
        <linearGradient id="sx-g" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#00e5ff" />
          <stop offset="45%"  stopColor="#3060ff" />
          <stop offset="100%" stopColor="#9b00ff" />
        </linearGradient>

        {/* Outer bloom (wide, soft) */}
        <filter id="sx-bloom" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur-wide" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur-tight" />
          <feMerge>
            <feMergeNode in="blur-wide"  />
            <feMergeNode in="blur-tight" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#sx-bloom)">
        {/*
          SLIVER — upper-right, offset HIGHER than the main body.
          Flat top edge: (46,5)→(91,5)
          Sharp lower-left vertex: (7,73)
          This triangle sits elevated: its bottom vertex (y=73) is
          well above the main body's top vertex (y=25), creating the gap.
        */}
        <polygon
          points="46,5 91,5 7,73"
          fill="url(#sx-g)"
        />

        {/*
          MAIN BODY — lower-left, starts lower.
          Sharp upper-right vertex: (93,25)
          Flat bottom edge: (9,95)→(54,95)
          The top vertex (y=25) is clearly below the sliver's flat top (y=5),
          and the gap between the two shapes' diagonal edges is ~14 units wide.
        */}
        <polygon
          points="9,95 54,95 93,25"
          fill="url(#sx-g)"
        />
      </g>
    </svg>
  );
}

export default SyntaxureLogo;
