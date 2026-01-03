import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="glass-heavy fixed top-0 left-0 right-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/prism-icon.png"
                alt="Prism Context Engine"
                width={32}
                height={32}
                className="transition-transform group-hover:scale-110"
              />
              <span className="text-gradient-cyan font-bold text-lg">
                Prism Context Engine
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="http://localhost:3002"
                target="_blank"
                className="text-white/60 hover:text-cyan-400 transition-colors text-sm font-mono uppercase tracking-wider"
              >
                Docs
              </Link>
              <Link
                href="https://jeffdev.studio"
                target="_blank"
                className="text-white/60 hover:text-cyan-400 transition-colors text-sm font-mono uppercase tracking-wider"
              >
                Agency
              </Link>
              <Link
                href="/sign-in"
                className="text-white/60 hover:text-white transition-colors text-sm font-mono uppercase tracking-wider"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="glass px-4 py-2 rounded-md hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider text-white"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16">
        {/* Grid Background */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-[#050505] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Gradient Orb */}
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-full blur-3xl -z-10" />

        <div className="text-center max-w-3xl">
          {/* Version Badge */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02]">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="font-mono text-xs text-white/60 uppercase tracking-wider">
              Prism Context Engine v1.0.0
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              The Context Operating System
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              for Vibecoders
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-white/60 text-lg md:text-xl mb-4 max-w-2xl mx-auto leading-relaxed">
            Record your architecture. AI learns your rules. Deploy context directly to Cursor, Windsurf, and Claude via MCP.
          </p>
          <p className="text-cyan-400/80 text-base md:text-lg mb-10 font-mono">
            Eliminate context pollution. Forever.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/sign-up"
              className="group relative overflow-hidden rounded-md border border-cyan-500/30 bg-cyan-500/10 px-8 py-4 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/20 active:scale-95"
            >
              <span className="font-mono text-sm uppercase tracking-wider text-white font-semibold">
                Start Free →
              </span>
            </Link>
            <Link
              href="http://localhost:3002"
              target="_blank"
              className="rounded-md border border-white/10 bg-white/[0.02] px-8 py-4 transition-all hover:bg-white/[0.05] hover:border-white/20 active:scale-95"
            >
              <span className="font-mono text-sm uppercase tracking-wider text-white/80">
                View Docs
              </span>
            </Link>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="glass px-4 py-2 rounded-full">
              <span className="text-xs text-white/60 font-mono">📹 Video → Context</span>
            </div>
            <div className="glass px-4 py-2 rounded-full">
              <span className="text-xs text-white/60 font-mono">🤖 AI Rule Extraction</span>
            </div>
            <div className="glass px-4 py-2 rounded-full">
              <span className="text-xs text-white/60 font-mono">🔌 MCP Protocol</span>
            </div>
            <div className="glass px-4 py-2 rounded-full">
              <span className="text-xs text-white/60 font-mono">⚡ Real-time Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/prism-icon.png"
                  alt="Prism Context Engine"
                  width={24}
                  height={24}
                />
                <span className="text-gradient-cyan font-bold">Prism Context Engine</span>
              </div>
              <p className="text-white/40 text-sm">
                The Context Operating System for developers who ship fast.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="http://localhost:3002" target="_blank" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Docs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="https://jeffdev.studio" target="_blank" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    About JD Studio
                  </Link>
                </li>
                <li>
                  <Link href="https://jeffdev.studio/contact" target="_blank" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Get Started</h3>
              <p className="text-white/60 text-sm mb-4">
                Ready to eliminate context pollution?
              </p>
              <Link
                href="/sign-up"
                className="inline-block glass px-6 py-2 rounded-md hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider text-white"
              >
                Start Free →
              </Link>
            </div>
          </div>

          <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/30 text-xs font-mono">
              © {new Date().getFullYear()} JD Studio. Built with Prism Context Engine.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/terms" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
