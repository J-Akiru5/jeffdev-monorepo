export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Grid Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-[#050505] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Gradient Orb */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-full blur-3xl -z-10" />

      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02]">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="font-mono text-xs text-white/60 uppercase tracking-wider">
            Prism Engine v0.1.0
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Context Governance
          </span>
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            for LLMs
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-white/60 text-lg md:text-xl mb-10 max-w-lg mx-auto">
          Stop AI hallucinations. Deploy a Context Server that forces Cursor, Windsurf, and Claude to follow your Design System.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/sign-up"
            className="group relative overflow-hidden rounded-md border border-white/10 bg-white/[0.02] px-8 py-3 transition-all hover:border-cyan-500/50 active:scale-95"
          >
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="font-mono text-sm uppercase tracking-wider text-white">
              Get Started →
            </span>
          </a>
          <a
            href="https://jeffdev.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-white/5 bg-transparent px-8 py-3 transition-all hover:bg-white/[0.02] hover:border-white/10 active:scale-95"
          >
            <span className="font-mono text-sm uppercase tracking-wider text-white/60">
              Learn More
            </span>
          </a>
        </div>
      </div>

      {/* Footer Badge */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <span className="font-mono text-xs text-white/30">
          Built by JeffDev Studio
        </span>
      </div>
    </main>
  );
}
