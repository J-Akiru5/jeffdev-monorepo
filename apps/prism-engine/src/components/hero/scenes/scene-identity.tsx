"use client";

import Link from "next/link";
import { ScanSearch, BrainCircuit, Network, Zap } from "lucide-react";

export function SceneIdentity() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center w-full max-w-5xl mx-auto pt-32 pb-24">
      {/* Headlines */}
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-[var(--text-primary)] leading-[1.1]">
        The Context Operating <br className="hidden md:block" />
        <span className="text-gradient-aurora">for Vibecoders</span>
      </h1>

      {/* Outcome Badge */}
      <div className="mt-4 mb-2 inline-flex items-center px-8 py-3 rounded-full bg-black/60 border border-[var(--border-active)] shadow-2xl backdrop-blur-xl">
        <span className="text-[var(--text-primary)] text-lg md:text-xl font-medium tracking-tight">
          Eliminate context pollution. Forever.
        </span>
      </div>

      {/* Description */}
      <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-6 font-medium">
        Scan your architecture via Playwright. AI learns your rules. Deploy context directly to Cursor, Windsurf, and Claude via MCP.
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
        <Link
          href="/sign-up"
          className="border-beam relative inline-flex items-center justify-center rounded-xl border border-[var(--aurora-1)]/40 bg-gradient-to-r from-[var(--aurora-1)]/20 to-[var(--aurora-2)]/20 px-8 py-4 transition-all hover:bg-[var(--aurora-1)]/30 hover:scale-105 shadow-[0_0_20px_var(--aurora-1)]/20"
        >
          <span className="font-mono text-sm uppercase tracking-widest text-[var(--text-primary)] font-bold">
            START FREE &rarr;
          </span>
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 backdrop-blur-md px-8 py-4 transition-all hover:bg-white/10 hover:border-white/40"
        >
          <span className="font-mono text-sm uppercase tracking-widest text-[var(--text-primary)] font-bold">
            VIEW PRICING
          </span>
        </Link>
        <Link
          href="https://docs.syntaxure.dev"
          className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 backdrop-blur-md px-8 py-4 transition-all hover:bg-white/10 hover:border-white/40"
        >
          <span className="font-mono text-sm uppercase tracking-widest text-[var(--text-primary)] font-bold">
            VIEW DOCS
          </span>
        </Link>
      </div>

      {/* Feature Pills (No emojis, using Lucide SVGs) */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          <ScanSearch className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">Playwright Scan</span>
        </div>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          <BrainCircuit className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">AI Rule Extraction</span>
        </div>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          <Network className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">MCP Protocol</span>
        </div>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          <Zap className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">Real-time Sync</span>
        </div>
      </div>
    </div>
  );
}

export default SceneIdentity;
