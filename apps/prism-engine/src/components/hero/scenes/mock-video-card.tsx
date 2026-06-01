"use client";

/**
 * MockVideoCard — faked "video → context" capture card.
 * Dark: glass-elevated. Light: white card.
 */

import { useEffect, useState } from "react";

const RULES = [
  "Use Tailwind v4 utilities only",
  "API routes follow App Router conventions",
  "No `any` types in /lib/**",
  "Prefer Server Actions over route handlers",
  "Validate env vars with Zod at boot",
  "All exports use named, never default",
  "Components accept className via cn()",
] as const;

export function MockVideoCard() {
  const [progress, setProgress] = useState(0);
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 0.6)), 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTypedCount((c) => (c >= RULES.length ? 0 : c + 1)), 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-elevated rounded-xl w-full max-w-md p-5 font-mono text-sm">
      <div className="flex items-center justify-between mb-3 text-[var(--text-tertiary)]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--aurora-3)] animate-pulse" />
          <span className="text-xs uppercase tracking-widest">REC</span>
          <span className="text-xs">02:14</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-1)]/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-2)]/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-3)]/40" />
        </div>
      </div>

      <div className="relative aspect-video rounded-md overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-secondary)] mb-4">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--aurora-1) 20%, transparent), color-mix(in oklab, var(--aurora-2) 15%, transparent))",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--aurora-1)]/30"
          aria-hidden="true"
        >
          <div
            className="h-full bg-[var(--aurora-1)] transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-quiet)] text-xs uppercase tracking-widest">
          Architecture Walkthrough
        </div>
      </div>

      <div className="space-y-1.5 min-h-[160px]">
        {RULES.slice(0, typedCount).map((rule, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-[var(--text-secondary)] text-xs"
          >
            <span className="text-[var(--aurora-1)] mt-0.5">▸</span>
            <code>{rule}</code>
          </div>
        ))}
        {typedCount < RULES.length ? (
          <div className="flex items-center gap-1 text-[var(--text-tertiary)] text-xs">
            <span className="inline-block w-1.5 h-3 bg-[var(--aurora-2)] animate-pulse" />
            <span>extracting…</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
        <span>Extracted</span>
        <span className="text-[var(--aurora-1)]">{typedCount} / {RULES.length} rules</span>
      </div>
    </div>
  );
}

export default MockVideoCard;
