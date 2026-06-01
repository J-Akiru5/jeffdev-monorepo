"use client";

/**
 * SceneDeploy — IDE card flips in. Shows MCP + AI chat + streaming.
 */

import { MockIdeCard } from "./mock-ide-card";
import { TextReveal } from "../text-reveal";
import type { HeroScene } from "./scene-data";

interface SceneDeployProps {
  scene: HeroScene;
}

export function SceneDeploy({ scene }: SceneDeployProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center">
      <div className="md:col-span-4 flex flex-col items-start gap-4 order-2 md:order-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--aurora-3)]/30 bg-[var(--aurora-3)]/5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--aurora-3)]">
            {scene.eyebrow}
          </span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          <TextReveal
            text={scene.headline}
            as="span"
            className="bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent"
          />
        </h2>
        <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-md leading-relaxed">
          {scene.sub}
        </p>
        {scene.metric ? (
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[var(--aurora-3)] font-mono">
              {scene.metric.value}
            </span>
            <span className="text-xs uppercase tracking-widest text-[var(--text-tertiary)]">
              {scene.metric.label}
            </span>
          </div>
        ) : null}
      </div>

      <div className="md:col-span-8 order-1 md:order-2 flex justify-center">
        <MockIdeCard />
      </div>
    </div>
  );
}

export default SceneDeploy;
