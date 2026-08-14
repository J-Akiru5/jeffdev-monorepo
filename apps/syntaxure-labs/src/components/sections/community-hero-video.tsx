"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Community Hero Video
 * ---------------------
 * Full-viewport cinematic marketing video shown at the top of /community.
 * Autoplays muted, loops indefinitely. No player controls — pure visual.
 *
 * After the video completes its first loop, a subtle "Scroll" indicator
 * fades in at the bottom of the viewport, hinting that content continues
 * below. Clicking it smooth-scrolls to the community content.
 *
 * Implementation detail: the native `loop` attribute is intentionally
 * omitted. Instead we listen for the `ended` event, show the scroll hint
 * on the first fire, and manually restart playback. This gives us a clean
 * hook into loop count without polling `currentTime`.
 */
const DEFAULT_VIDEO_URL =
  "https://uswduulrqwzovctdoiao.supabase.co/storage/v1/object/public/marketing/community-hero.mp4";

export function CommunityHeroVideo() {
  const videoUrl =
    process.env.NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_URL || DEFAULT_VIDEO_URL;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const hasShownHint = useRef(false);

  const handleEnded = useCallback(() => {
    if (!hasShownHint.current) {
      hasShownHint.current = true;
      setShowScrollHint(true);
    }
    // Restart playback manually (no `loop` attr so `ended` fires each time)
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
      {/* Video — fills viewport, crops via object-cover for any aspect ratio */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Bottom gradient — keeps the scroll hint readable over any video frame */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Scroll hint — fades in after first loop completes */}
      <button
        type="button"
        onClick={scrollToContent}
        aria-label="Scroll to content"
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex cursor-pointer flex-col items-center gap-1.5 transition-opacity duration-1000 ${
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
