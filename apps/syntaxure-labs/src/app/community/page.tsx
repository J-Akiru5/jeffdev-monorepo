import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Users,
  GitCommit,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CommunityTabs } from "@/components/sections/community-tabs";
import { CommunityHeroVideo } from "@/components/sections/community-hero-video";
import { ReleaseTimeline } from "@/components/sections/release-timeline";
import { createClient } from "@/lib/supabase/server";
import { getPublishedCommunityPosts } from "@/app/actions/community";
import { logDataError } from "@/lib/errors";
import type { Metadata } from "next";
import type { Release } from "@/types/database";

/**
 * Community Page
 * --------------
 * Showcases Syntaxure Labs releases, community updates, and discussions.
 * Hybrid layout: featured releases as hero cards + chronological changelog timeline + discussions feed.
 * Dark stealth-luxury aesthetic matching the Syntaxure Labs design system.
 */

export const metadata: Metadata = {
  title: "Community",
  description:
    "Stay up to date with the latest Syntaxure Labs releases, tools, and platform updates. Join discussions, share your projects, and connect with the community.",
};

export const dynamic = "force-dynamic";

async function getReleases(): Promise<{
  featured: Release[];
  timeline: Release[];
}> {
  const supabase = await createClient();

  const [{ data: featured }, { data: timeline }] = await Promise.all([
    supabase
      .from("releases")
      .select("*")
      .eq("is_featured", true)
      .order("date", { ascending: false })
      .limit(6),
    supabase
      .from("releases")
      .select("*")
      .eq("is_featured", false)
      .order("date", { ascending: false })
      .limit(50),
  ]);

  return {
    featured: (featured ?? []) as Release[],
    timeline: (timeline ?? []) as Release[],
  };
}

export default async function CommunityPage() {
  // Releases and community posts are independent — fetch in parallel.
  const [releasesResult, communityPosts] = await Promise.all([
    getReleases().catch((error) => {
      logDataError("[community] Failed to fetch releases", error);
      return { featured: [] as Release[], timeline: [] as Release[] };
    }),
    getPublishedCommunityPosts(),
  ]);

  const featuredReleases = releasesResult.featured;
  const recentReleases = releasesResult.timeline;

  const totalPosts = featuredReleases.length + recentReleases.length;

  return (
    <>
      <Header />
      <main className="pt-32 pb-16">
        {/* Desktop Absolute Back Button (Sits on the left side, professional style) */}
        <div className="hidden xl:flex absolute left-[max(2rem,calc(50%-54rem))] top-36 z-50">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <section className="px-6 pb-8 lg:px-8">
          <div className="mx-auto max-w-7xl relative">
            {/* Mobile/Tablet: Back button */}
            <div className="mb-8 xl:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="h-4 w-4 transition-transform hover:-translate-x-0.5" />
                Back to Home
              </Link>
            </div>

            <div className="mt-8 max-w-3xl">
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                {"// Community"}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                What We&apos;re{" "}
                <span className="text-gradient-holographic">Building</span>
              </h1>
              <p className="mt-4 text-lg text-white/60">
                Follow our journey. Every release, update, and tool we ship is
                documented here. From major platform launches to the smallest
                quality-of-life patches. Join the conversation, share your
                projects, and connect with the community.
              </p>
            </div>

            {/* Marketing Video (renders nothing until NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_URL is set) */}
            <CommunityHeroVideo />

            {/* Quick Stats */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                <Users className="h-5 w-5 text-cyan-400" />
                <div className="mt-3 text-2xl font-bold text-white">
                  {totalPosts}
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
                  {recentReleases.filter((r) => r.type === "patch").length}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Patches
                </div>
              </div>
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
                <ArrowUpRight className="h-5 w-5 text-amber-400" />
                <div className="mt-3 text-2xl font-bold text-white">
                  {communityPosts.length}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Discussions
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabbed Content: Changelog + Discussions */}
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <CommunityTabs
              changelogCount={totalPosts}
              posts={communityPosts}
              timeline={
                <ReleaseTimeline
                  featured={featuredReleases.map((r) => ({
                    id: r.id,
                    title: r.title,
                    version: r.version,
                    date: r.date,
                    type: r.type as "tool" | "update" | "patch",
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
                    type: r.type as "tool" | "update" | "patch",
                    description: r.description,
                    link: r.link,
                    tags: r.tags,
                    is_featured: r.is_featured,
                  }))}
                />
              }
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
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/community/register"
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
