import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Users, GitCommit, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ReleaseTimeline } from '@/components/sections/release-timeline';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import type { Release } from '@/types/database';

/**
 * Community Page
 * --------------
 * Showcases Syntaxure Labs releases and community updates.
 * Hybrid layout: featured releases as hero cards + chronological changelog timeline.
 * Dark stealth-luxury aesthetic matching the Syntaxure Labs design system.
 */

export const metadata: Metadata = {
  title: 'Community',
  description:
    'Stay up to date with the latest Syntaxure Labs releases, tools, and platform updates. Follow our changelog and see what we are building.',
};

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  let featuredReleases: Release[] = [];
  let recentReleases: Release[] = [];

  try {
    const supabase = await createClient();
    
    // Fetch featured releases
    const { data: featured } = await supabase
      .from('releases')
      .select('*')
      .eq('is_featured', true)
      .order('date', { ascending: false })
      .limit(6);

    // Fetch non-featured releases
    const { data: timeline } = await supabase
      .from('releases')
      .select('*')
      .eq('is_featured', false)
      .order('date', { ascending: false })
      .limit(50);

    featuredReleases = (featured ?? []) as Release[];
    recentReleases = (timeline ?? []) as Release[];
  } catch (error) {
    console.error('[community] Failed to fetch releases:', error);
  }

  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <div className="mt-8 max-w-3xl">
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                {'// Community'}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                What We&apos;re{' '}
                <span className="text-gradient-holographic">Building</span>
              </h1>
              <p className="mt-4 text-lg text-white/60">
                Follow our journey. Every release, update, and tool we ship is
                documented here — from major platform launches to the smallest
                quality-of-life patches.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                <Users className="h-5 w-5 text-cyan-400" />
                <div className="mt-3 text-2xl font-bold text-white">
                  {featuredReleases.length + recentReleases.length}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Total Releases
                </div>
              </div>
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <div className="mt-3 text-2xl font-bold text-white">
                  {featuredReleases.length}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Featured
                </div>
              </div>
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                <GitCommit className="h-5 w-5 text-emerald-400" />
                <div className="mt-3 text-2xl font-bold text-white">
                  {recentReleases.filter((r) => r.type === 'patch').length}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Patches
                </div>
              </div>
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                <ArrowUpRight className="h-5 w-5 text-amber-400" />
                <div className="mt-3 text-2xl font-bold text-white">
                  {recentReleases.filter((r) => r.type === 'tool').length}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Tools
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Releases Timeline */}
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <ReleaseTimeline
              featured={featuredReleases.map((r) => ({
                id: r.id,
                title: r.title,
                version: r.version,
                date: r.date,
                type: r.type as 'tool' | 'update' | 'patch',
                description: r.description,
                link: r.link,
                tags: r.tags,
                is_featured: r.is_featured,
              }))}
              releases={recentReleases.map((r) => ({
                id: r.id,
                title: r.title,
                version: r.version,
                date: r.date,
                type: r.type as 'tool' | 'update' | 'patch',
                description: r.description,
                link: r.link,
                tags: r.tags,
                is_featured: r.is_featured,
              }))}
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-white/[0.06] px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white">
              Want Early Access?
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Get notified about new releases, beta programs, and exclusive
              tools before anyone else.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/contact"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-md border border-cyan-500/50 bg-cyan-500/10 px-6 py-3.5 font-mono text-sm uppercase tracking-wider text-white backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
              >
                Join the Community
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
