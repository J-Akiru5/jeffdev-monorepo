"use client";

import { useInView } from "@/lib/use-in-view";

const logos = [
  "Cursor",
  "Windsurf",
  "VS Code",
  "GitHub Copilot",
  "Claude",
  "OpenAI",
];

export function SocialProof() {
  const { ref, isInView } = useInView({ rootMargin: "-80px" });

  return (
    <section
      ref={ref}
      className="section-padding border-y border-slate-100 bg-white"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="mb-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
          Built for the tools you already use
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6"
          style={{
            opacity: isInView ? 1 : 0,
            transition: "opacity 0.5s ease-out",
          }}
        >
          {logos.map((name, i) => (
            <div
              key={name}
              className="flex items-center gap-2 font-mono text-sm font-semibold text-slate-300"
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(10px)",
                transition: `opacity 0.4s ease-out ${i * 0.08}s, transform 0.4s ease-out ${i * 0.08}s`,
              }}
            >
              <span className="text-slate-400">/</span>
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SocialProof;