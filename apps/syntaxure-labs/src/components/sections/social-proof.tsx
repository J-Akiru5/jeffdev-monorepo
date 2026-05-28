"use client";

/**
 * Social Proof — Infinite-Scroll Logo Carousel
 * ---------------------------------------------
 * Auto-scrolling marquee of partner tools and tech stack.
 * No header message — logos speak for themselves.
 * CSS-only animation, pauses on hover.
 *
 * Logo categories:
 * - Tech Stack: Next.js, Supabase, Doppler, DigitalOcean, TypeScript, Tailwind CSS
 * - IDEs: Antigravity, VS Code, Cursor
 * - AI: Claude, OpenAI, GitHub Copilot
 */

/* ────────────────────────────────────────
   LOGO DATA
   ──────────────────────────────────────── */
interface LogoItem {
  name: string;
  /** CSS color for the brand dot indicator */
  color: string;
}

const logos: LogoItem[] = [
  // Tech Stack
  { name: "Next.js", color: "#ffffff" },
  { name: "Supabase", color: "#3ecf8e" },
  { name: "Doppler", color: "#6366f1" },
  { name: "DigitalOcean", color: "#0080ff" },
  { name: "TypeScript", color: "#3178c6" },
  { name: "Tailwind CSS", color: "#06b6d4" },
  // IDEs
  { name: "Antigravity", color: "#a78bfa" },
  { name: "VS Code", color: "#007acc" },
  { name: "Cursor", color: "#ffffff" },
  // AI
  { name: "Claude", color: "#d4a574" },
  { name: "OpenAI", color: "#10a37f" },
  { name: "GitHub Copilot", color: "#6e40c9" },
];

/* ────────────────────────────────────────
   LOGO PILL COMPONENT
   ──────────────────────────────────────── */
function LogoPill({ name, color }: LogoItem) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 backdrop-blur-sm whitespace-nowrap transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] group">
      {/* Brand color dot */}
      <span
        className="h-2 w-2 rounded-full shrink-0 transition-shadow duration-300 group-hover:shadow-[0_0_8px_var(--dot-color)]"
        style={{
          backgroundColor: color,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ["--dot-color" as any]: `${color}80`,
        }}
      />
      <span className="font-mono text-xs font-medium text-white/60 transition-colors duration-300 group-hover:text-white/90">
        {name}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────
   CAROUSEL COMPONENT
   ──────────────────────────────────────── */
export function SocialProof() {
  // Double the logos for seamless infinite loop
  const doubled = [...logos, ...logos];

  return (
    <section className="relative border-y border-white/5 bg-[#0a0a0a] py-6 overflow-hidden">
      {/* Left fade mask */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent" />

      {/* Right fade mask */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent" />

      {/* Scrolling track */}
      <div className="animate-marquee flex items-center gap-4 w-max">
        {doubled.map((logo, i) => (
          <LogoPill key={`${logo.name}-${i}`} {...logo} />
        ))}
      </div>
    </section>
  );
}

export default SocialProof;