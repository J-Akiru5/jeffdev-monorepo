import Link from "next/link";
import { PlayCircle, ArrowUpRight } from "lucide-react";

/**
 * Community Hero Video
 * ---------------------
 * Marketing video shown at the top of /community, promoting Syntaxure Labs
 * and the Prism Context Engine. Sourced from the `marketing` Supabase
 * Storage bucket via NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_URL.
 *
 * Renders nothing if the env var isn't set yet, so this ships safely before
 * the video file has been uploaded — the section just appears once the URL
 * is configured and the app is redeployed. No client-side JS needed; the
 * browser's native <video controls> handles play/pause/fullscreen.
 */
// Public Supabase Storage URL — not a secret, safe to bake in as the default
// so the section works out of the box. Override via env var if the video
// is ever swapped without a code change.
const DEFAULT_VIDEO_URL =
  "https://uswduulrqwzovctdoiao.supabase.co/storage/v1/object/public/marketing/community-hero.mp4";

export function CommunityHeroVideo() {
  const videoUrl =
    process.env.NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_URL || DEFAULT_VIDEO_URL;
  const posterUrl = process.env.NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_POSTER;

  if (!videoUrl) return null;

  return (
    <div className="mt-10 overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <div className="relative aspect-video w-full bg-black">
        <video
          controls
          preload="metadata"
          poster={posterUrl}
          className="h-full w-full"
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser doesn&apos;t support embedded video.{" "}
          <a href={videoUrl} className="underline">
            Watch it here
          </a>
          .
        </video>
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-md border border-white/[0.08] bg-black/50 px-3 py-1.5 backdrop-blur-md">
          <PlayCircle className="h-4 w-4 text-cyan-400" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/70">
            Watch the story
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/50">
          See how Syntaxure Labs builds — and how the{" "}
          <span className="text-white/80">Prism Context Engine</span> powers
          it.
        </p>
        <Link
          href="/prism"
          className="group inline-flex shrink-0 items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-cyan-400 transition-colors hover:text-cyan-300"
        >
          Explore Prism
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
