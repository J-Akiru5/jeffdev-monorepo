"use client";

/**
 * Prism3D Component
 * ------------------
 * A pure CSS 3D rotating triangular prism with glassmorphism effects.
 * Uses CSS transforms and animations to create a futuristic, abstract artifact.
 * Updated to support both light and dark modes.
 */

import clsx from "clsx";

interface Prism3DProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl"; // Kept for TS compatibility with animated-hero
}

export function Prism3D({ className }: Prism3DProps) {
  return (
    <div
      className={clsx(
        "relative flex items-center justify-center",
        className,
      )}
    >
      <div className="prism-scene">
        <div className="prism-pivot">
          {/* Side 1 */}
          <div className="prism-face prism-side side-1">
            <div className="prism-shine" />
          </div>
          {/* Side 2 */}
          <div className="prism-face prism-side side-2">
            <div className="prism-shine" />
          </div>
          {/* Side 3 */}
          <div className="prism-face prism-side side-3">
            <div className="prism-shine" />
          </div>

          {/* Top Cap (Triangle) */}
          <div className="prism-face prism-cap cap-top" />
          {/* Bottom Cap (Triangle) */}
          <div className="prism-face prism-cap cap-bottom" />

          {/* Internal Glow Core */}
          <div className="prism-core" />
        </div>
      </div>

      <style jsx>{`
        .prism-scene {
          width: 200px;
          height: 300px;
          perspective: 1000px;
        }

        .prism-pivot {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: float-rotate 20s linear infinite;
          will-change: transform;
        }

        .prism-face {
          position: absolute;
          box-sizing: border-box;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          backface-visibility: visible;
          border: 1px solid rgba(0, 0, 0, 0.3);
          box-shadow: 0 0 30px rgba(6, 182, 212, 0.3) inset;
        }

        :global(.dark) .prism-face {
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        /* Rectangular Sides */
        .prism-side {
          width: 200px;
          height: 300px;
          background: linear-gradient(
            135deg,
            rgba(6, 182, 212, 0.15) 0%,
            rgba(168, 85, 247, 0.05) 100%
          );
          overflow: hidden;
        }

        :global(.dark) .prism-side {
          background: linear-gradient(
            135deg,
            rgba(6, 182, 212, 0.25) 0%,
            rgba(168, 85, 247, 0.15) 100%
          );
        }

        .prism-shine {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 150%;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(6, 182, 212, 0.1) 40%,
            rgba(168, 85, 247, 0.1) 60%,
            transparent
          );
          transform: translateY(-100%);
          animation: shine 8s ease-in-out infinite;
        }

        /* 
           Triangular Prism Geometry
           Width: 200px
           Apothem (center to face) for equilateral triangle of side 200px:
           a = side / (2 * tan(180/3)) = 200 / 3.464 = 57.7px
        */

        .side-1 {
          transform: translateZ(58px);
        }
        .side-2 {
          transform: rotateY(120deg) translateZ(58px);
        }
        .side-3 {
          transform: rotateY(240deg) translateZ(58px);
        }

        /* Caps (Triangles) */
        .prism-cap {
          width: 200px;
          height: 174px; /* sqrt(3)/2 * 200 */
          border: none;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.1),
            rgba(0, 0, 0, 0.02)
          );
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }

        :global(.dark) .prism-cap {
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.02)
          );
        }

        .cap-top {
          transform: rotateX(90deg) translateZ(150px);
          top: -87px; 
          display: none; /* Hiding caps for now to ensure clean glass lines */
        }

        .cap-bottom {
          transform: rotateX(-90deg) translateZ(242px);
          bottom: 0;
          left: 0;
          display: none;
        }

        /* The Core - a glowing orb inside */
        .prism-core {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100px;
          height: 100px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(6, 182, 212, 0.8) 0%,
            transparent 70%
          );
          filter: blur(20px);
          animation: pulse 4s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @keyframes float-rotate {
          0% {
            transform: rotateX(0deg) rotateY(0deg);
          }
          50% {
            transform: rotateX(15deg) rotateY(180deg);
          }
          100% {
            transform: rotateX(0deg) rotateY(360deg);
          }
        }

        @keyframes shine {
          0%,
          100% {
            transform: translateY(-100%) rotate(45deg);
            opacity: 0;
          }
          50% {
            transform: translateY(100%) rotate(45deg);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.8;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .prism-pivot {
            animation: none;
            transform: rotateX(15deg) rotateY(180deg);
          }
          .prism-shine {
            animation: none;
            opacity: 0.5;
            transform: translateY(50%) rotate(45deg);
          }
          .prism-core {
            animation: none;
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}

export default Prism3D;
