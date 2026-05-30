"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { GlassPanel, Button } from "@syntaxure/ui";

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: typeof Sparkles;
  backHref?: string;
  backLabel?: string;
}

/**
 * Reusable Coming Soon page component.
 * Used for features that are not yet implemented in the MVP.
 */
export function ComingSoon({
  title,
  description,
  icon: Icon = Sparkles,
  backHref,
  backLabel = "Go back",
}: ComingSoonProps) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      )}

      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]">
          <Icon className="h-8 w-8 text-cyan-400" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {title}
        </h1>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">{description}</p>
      </div>

      <GlassPanel className="p-8">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">
              Coming Soon
            </span>
          </div>

          <p className="text-[var(--text-tertiary)] text-sm max-w-sm mx-auto">
            This feature is currently under development and will be available in
            a future release. Stay tuned for updates.
          </p>

          {backHref && (
            <Button variant="secondary" size="sm" asChild>
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
