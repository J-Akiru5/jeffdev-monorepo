"use client";

/**
 * SceneCapture — prism shrinks/drift left, code-token chaos field,
 * light beam projects to the mock video card.
 */

import { Prism3D } from "../prism-3d";
import { CodeTokenField } from "../code-token-field";
import { MockVideoCard } from "./mock-video-card";
import { TextReveal } from "../text-reveal";
import type { HeroScene } from "./scene-data";

interface SceneCaptureProps {
  scene: HeroScene;
}

export function SceneCapture({ scene }: SceneCaptureProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center">
      <div className="md:col-span-5 flex flex-col items-start gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--aurora-2)]/30 bg-[var(--aurora-2)]/5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--aurora-2)]">
            {scene.eyebrow}
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          <TextReveal text={scene.headline} as="span" className="bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent" />
        </h2>
        <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-md leading-relaxed">
          {scene.sub}
        </p>
        {scene.metric ? (
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[var(--aurora-1)] font-mono">
              {scene.metric.value}
            </span>
            <span className="text-xs uppercase tracking-widest text-[var(--text-tertiary)]">
              {scene.metric.label}
            </span>
          </div>
        ) : null}
      </div>

      <div className="md:col-span-7 relative flex items-center justify-center">
        {/* Prism on the left of the card */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 scale-50 origin-right">
          <Prism3D size="lg" withBeam />
        </div>

        {/* Chaos field of code tokens behind the card */}
        <CodeTokenField className="absolute inset-0" count={32} />

        {/* Mock video card */}
        <div className="relative z-20 ml-12">
          <MockVideoCard />
        </div>
      </div>
    </div>
  );
}

export default SceneCapture;
