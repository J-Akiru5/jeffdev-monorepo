interface LogoItem {
  name: string;
  color: string;
}

const logos: LogoItem[] = [
  // Tech Stack
  { name: "Next.js", color: "#64748b" },
  { name: "Supabase", color: "#3ecf8e" },
  { name: "Doppler", color: "#6366f1" },
  { name: "DigitalOcean", color: "#0080ff" },
  { name: "TypeScript", color: "#3178c6" },
  { name: "Tailwind CSS", color: "#06b6d4" },
  // IDEs
  { name: "Antigravity", color: "#a78bfa" },
  { name: "VS Code", color: "#007acc" },
  { name: "Cursor", color: "#64748b" },
  // AI
  { name: "Claude", color: "#d4a574" },
  { name: "OpenAI", color: "#10a37f" },
  { name: "GitHub Copilot", color: "#6e40c9" },
];

function LogoPill({ name, color }: LogoItem) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2.5 whitespace-nowrap transition-all duration-300 hover:border-[var(--text-tertiary)] hover:shadow-sm group">
      {/* Brand color dot */}
      <span
        className="h-2 w-2 rounded-full shrink-0 transition-shadow duration-300 group-hover:shadow-md"
        style={{
          backgroundColor: color,
        }}
      />
      <span className="font-mono text-xs font-bold text-[var(--text-secondary)] transition-colors duration-300 group-hover:text-[var(--text-primary)]">
        {name}
      </span>
    </div>
  );
}

export function SocialProof() {
  const doubled = [...logos, ...logos];

  return (
    <section className="relative border-y border-[var(--border-subtle)] py-6 overflow-hidden">
      {/* Left fade mask */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-[var(--bg-primary)] to-transparent" />

      {/* Right fade mask */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-[var(--bg-primary)] to-transparent" />

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