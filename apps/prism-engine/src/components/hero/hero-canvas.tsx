"use client";

/**
 * HeroCanvas — Static layout orchestrator.
 * Replaces the old scrollytelling format with a single, high-impact Hero block.
 */

import { SceneIdentity } from "./scenes/scene-identity";

export function HeroCanvas() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center pt-24 pb-12"
      aria-label="Prism Context Engine — The Context Operating System"
    >
      <div className="aurora-mesh" aria-hidden="true">
        <div className="grain" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <SceneIdentity />
      </div>
    </section>
  );
}

export default HeroCanvas;
