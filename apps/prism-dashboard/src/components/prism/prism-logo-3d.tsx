'use client';

/**
 * PrismLogo3D Component
 * ---------------------
 * A smaller, logo-sized 3D rotating pyramid with glassmorphism effects.
 * Based on the Prism Context Engine icon - a triangular prism shape.
 * Uses pure CSS transforms and animations.
 */

import clsx from 'clsx';

interface PrismLogo3DProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PrismLogo3D({ className, size = 'md' }: PrismLogo3DProps) {
  const sizeConfig = {
    sm: { scene: 40, height: 50 },
    md: { scene: 60, height: 75 },
    lg: { scene: 80, height: 100 },
  };

  const { scene, height } = sizeConfig[size];

  return (
    <div className={clsx('relative flex items-center justify-center', className)}>
      <div 
        className="prism-logo-scene"
        style={{ 
          width: scene, 
          height: height,
          perspective: 500,
        }}
      >
        <div className="prism-logo-pivot">
          {/* Three rectangular sides of the prism */}
          <div className="prism-logo-face prism-logo-side side-1">
            <div className="prism-logo-shine" />
          </div>
          <div className="prism-logo-face prism-logo-side side-2">
            <div className="prism-logo-shine" />
          </div>
          <div className="prism-logo-face prism-logo-side side-3">
            <div className="prism-logo-shine" />
          </div>

          {/* Internal Glow Core */}
          <div className="prism-logo-core" />
        </div>
      </div>

      <style jsx>{`
        .prism-logo-scene {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .prism-logo-pivot {
          width: ${scene}px;
          height: ${height}px;
          position: relative;
          transform-style: preserve-3d;
          animation: logo-rotate 12s linear infinite;
        }

        .prism-logo-face {
          position: absolute;
          box-sizing: border-box;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          backface-visibility: visible;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.15) inset;
        }

        .prism-logo-side {
          width: ${scene}px;
          height: ${height}px;
          background: linear-gradient(
            135deg, 
            rgba(6, 182, 212, 0.1) 0%, 
            rgba(139, 92, 246, 0.05) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
          overflow: hidden;
        }

        .prism-logo-shine {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 200%;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(6, 182, 212, 0.2) 40%,
            rgba(168, 85, 247, 0.15) 60%,
            transparent
          );
          transform: translateY(-100%);
          animation: logo-shine 4s ease-in-out infinite;
        }

        /* Triangular prism geometry - apothem for equilateral triangle */
        .side-1 {
          transform: translateZ(${Math.round(scene / 3.46)}px);
        }
        .side-2 {
          transform: rotateY(120deg) translateZ(${Math.round(scene / 3.46)}px);
        }
        .side-3 {
          transform: rotateY(240deg) translateZ(${Math.round(scene / 3.46)}px);
        }

        /* The Core - a glowing orb inside */
        .prism-logo-core {
          position: absolute;
          top: 50%;
          left: 50%;
          width: ${Math.round(scene * 0.5)}px;
          height: ${Math.round(scene * 0.5)}px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle, 
            rgba(6, 182, 212, 0.9) 0%, 
            rgba(139, 92, 246, 0.4) 50%,
            transparent 70%
          );
          filter: blur(${Math.round(scene * 0.15)}px);
          animation: logo-pulse 3s ease-in-out infinite;
        }

        @keyframes logo-rotate {
          0% {
            transform: rotateX(5deg) rotateY(0deg);
          }
          50% {
            transform: rotateX(10deg) rotateY(180deg);
          }
          100% {
            transform: rotateX(5deg) rotateY(360deg);
          }
        }

        @keyframes logo-shine {
          0%, 100% { 
            transform: translateY(-100%); 
            opacity: 0; 
          }
          50% { 
            transform: translateY(100%); 
            opacity: 1; 
          }
        }

        @keyframes logo-pulse {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(0.8); 
            opacity: 0.6; 
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.1); 
            opacity: 0.9; 
          }
        }
      `}</style>
    </div>
  );
}

export default PrismLogo3D;
