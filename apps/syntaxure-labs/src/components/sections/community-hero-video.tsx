"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Community Hero Video
 * ---------------------
 * Full-viewport cinematic marketing video shown at the top of /community.
 * Autoplays muted, loops indefinitely. No player controls — pure visual.
 *
 * Responsive video sources:
 *   Desktop/tablet (≥768px) — landscape 16:9 video (default)
 *   Mobile (<768px) — portrait 9:16 video when available via
 *     NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_MOBILE_URL; falls back to the
 *     desktop video if unset.
 *
 * Scroll hint (desktop only):
 *   After the video completes its first loop, a subtle "Scroll ↓"
 *   indicator fades in. Hidden on mobile to keep the hero clean.
 *
 * Loop detection: the native `loop` attribute is intentionally omitted.
 * We listen for `ended`, count loops, and manually restart playback.
 */
const DEFAULT_VIDEO_URL =
  "https://uswduulrqwzovctdoiao.supabase.co/storage/v1/object/public/marketing/community-hero.mp4";

export function CommunityHeroVideo() {
  const videoUrl =
    process.env.NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_URL || DEFAULT_VIDEO_URL;
  const mobileVideoUrl =
    process.env.NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_MOBILE_URL;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasShownHint = useRef(false);

  // Detect mobile viewport for responsive video source
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Use portrait video on mobile if available, otherwise fall back to desktop
  const activeVideoUrl =
    isMobile && mobileVideoUrl ? mobileVideoUrl : videoUrl;

  const handleEnded = useCallback(() => {
    if (!hasShownHint.current) {
      hasShownHint.current = true;
      setShowScrollHint(true);
    }
    videoRef.current?.play();
  }, []);

  const scrollToContent = useCallback(() => {
    document
      .getElementById("community-content")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (!videoUrl) return null;

  return (
    <section className="relative h-dvh w-full overflow-hidden bg-black">
      {/* Video — fills viewport via object-cover; key forces remount on source swap */}
      <video
        key={activeVideoUrl}
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={activeVideoUrl} type="video/mp4" />
      </video>

      {/* Bottom gradient + scroll hint — desktop/tablet only */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-32 bg-gradient-to-t from-black/50 to-transparent md:block" />

      <button
        type="button"
        onClick={scrollToContent}
        aria-label="Scroll to content"
        className={`absolute bottom-8 left-1/2 hidden -translate-x-1/2 cursor-pointer flex-col items-center gap-1.5 transition-opacity duration-1000 md:flex ${
          showScrollHint ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
          Scroll
        </span>
        <ChevronDown className="h-5 w-5 animate-bounce text-white/60" />
      </button>
    </section>
  );
}
