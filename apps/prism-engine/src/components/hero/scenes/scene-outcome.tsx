"use client";

/**
 * SceneOutcome — final scene: dashboard card + CTAs.
 */

import Link from "next/link";
import { MockDashboardCard } from "./mock-dashboard-card";
import { TextReveal } from "../text-reveal";
import type { HeroScene } from "./scene-data";

interface SceneOutcomeProps {
  scene: HeroScene;
}

export function SceneOutcome({ scene }: SceneOutcomeProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--aurora-1)]/30 bg-[var(--aurora-1)]/5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--aurora-1)]">
          {scene.eyebrow}
        </span>
      </div>

      <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-center max-w-3xl">
        <TextReveal
          text={scene.headline}
          as="span"
          className="text-gradient-aurora"
        />
      </h2>

      <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-xl text-center leading-relaxed">
        {scene.sub}
      </p>

      <div className="w-full max-w-xl">
        <MockDashboardCard />
      </div>

      {scene.cta ? (
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href={scene.cta.primary.href}
            className="border-beam group relative inline-flex items-center gap-2 rounded-md border border-[var(--aurora-1)]/40 bg-[var(--aurora-1)]/10 px-7 py-3 transition-all hover:border-[var(--aurora-1)]/60 hover:bg-[var(--aurora-1)]/20 active:scale-95"
          >
            <span className="font-mono text-sm uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              {scene.cta.primary.label}
            </span>
          </Link>
          {scene.cta.secondary ? (
            <Link
              href={scene.cta.secondary.href}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-7 py-3 transition-all hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-active)] active:scale-95"
            >
              <span className="font-mono text-sm uppercase tracking-wider text-[var(--text-primary)]">
                {scene.cta.secondary.label}
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default SceneOutcome;
