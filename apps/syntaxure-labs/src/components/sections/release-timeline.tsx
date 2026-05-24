'use client';

/**
 * Release Timeline Component
 * --------------------------
 * Renders a technical changelog timeline with:
 * - Featured releases shown as hero cards
 * - Chronological timeline for all other releases
 * - Type-specific icons (Terminal for tools, Box for updates, Bug for patches)
 * - Dark stealth-luxury aesthetic matching the Syntaxure Labs design
 */

import { Terminal, Box, Bug, ExternalLink, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface Release {
  id: string;
  title: string;
  version: string | null;
  date: string;
  type: 'tool' | 'update' | 'patch';
  description: string;
  link: string | null;
  tags: string[] | null;
  is_featured: boolean;
}

interface ReleaseTimelineProps {
  featured: Release[];
  releases: Release[];
}

const typeConfig = {
  tool: {
    icon: Terminal,
    label: 'Tool Release',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]',
  },
  update: {
    icon: Box,
    label: 'Update',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
  },
  patch: {
    icon: Bug,
    label: 'Patch',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  },
};

function ReleaseCard({ release }: { release: Release }) {
  const config = typeConfig[release.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'group rounded-md border bg-white/[0.02] p-6 transition-all duration-300',
        config.border,
        'hover:bg-white/[0.04]',
        'hover:shadow-[0_0_30px_rgba(6,182,212,0.06)]',
      )}
    >
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border',
            config.border,
            config.bg,
          )}
        >
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white truncate">
              {release.title}
            </h3>
            {release.version && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px]',
                  config.border,
                  config.bg,
                  config.color,
                )}
              >
                {release.version}
              </span>
            )}
            <span
              className={cn(
                'font-mono text-[10px] uppercase tracking-wider',
                config.color,
              )}
            >
              {config.label}
            </span>
          </div>

          {/* Date */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/40">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(new Date(release.date), 'MMM d, yyyy')}</span>
          </div>

          {/* Description */}
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            {release.description}
          </p>

          {/* Tags */}
          {release.tags && release.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Tag className="h-3 w-3 text-white/30" />
              {release.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Link */}
          {release.link && (
            <a
              href={release.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400/70 transition-colors hover:text-cyan-400"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Learn more
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReleaseTimeline({ featured, releases }: ReleaseTimelineProps) {
  return (
    <div className="space-y-16">
      {/* Featured Section */}
      {featured.length > 0 && (
        <section>
          <div className="mb-6 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
              {"// Featured"}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((release) => (
              <div
                key={release.id}
                className={cn(
                  'group relative overflow-hidden rounded-md border bg-white/[0.02] p-6 transition-all duration-300',
                  typeConfig[release.type].border,
                  'hover:bg-white/[0.04]',
                  typeConfig[release.type].glow,
                )}
              >
                {/* Featured badge */}
                <div className="absolute top-0 right-0">
                  <div className="flex h-16 w-16 translate-x-6 -translate-y-6 rotate-45 items-center justify-center bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
                    <span className="mt-6 -rotate-45 font-mono text-[8px] uppercase tracking-[0.15em] text-white/50">
                      Featured
                    </span>
                  </div>
                </div>

                <ReleaseCard release={release} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timeline Section */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-white/40">
            {"// Changelog"}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        {releases.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/30 via-purple-500/20 to-transparent" />

            <div className="space-y-6">
              {releases.map((release, index) => (
                <div key={release.id} className="relative flex gap-6">
                  {/* Timeline dot */}
                  <div className="relative flex shrink-0 items-start pt-6">
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full border-2',
                        typeConfig[release.type].border,
                        typeConfig[release.type].bg,
                        'ring-1 ring-white/5',
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-4">
                    <ReleaseCard release={release} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] py-16">
            <Terminal className="h-8 w-8 text-white/20" />
            <p className="mt-3 text-sm text-white/30">
              No releases yet. Stay tuned for updates.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default ReleaseTimeline;
