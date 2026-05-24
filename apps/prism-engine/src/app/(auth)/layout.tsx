export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Brand showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[#050505] via-[#0a0a1a] to-[#0d0d2b] p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">
              Prism Context Engine
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-white">
              The Context Operating System
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                for Vibecoders
              </span>
            </h1>
            <p className="text-lg text-white/60 max-w-md leading-relaxed">
              Record your architecture. AI learns your rules. Deploy context
              directly to Cursor, Windsurf, and Claude via MCP.
            </p>

            <div className="space-y-3 pt-4">
              {[
                "AI-powered rule extraction from transcripts",
                "One-click deploy to Cursor & Windsurf",
                "MCP server for instant context sync",
                "Version-controlled rule library",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-white/70">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/30">
          &copy; {new Date().getFullYear()} Syntaxure Labs. All rights reserved.
        </div>
      </div>

      {/* Right: Auth content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#050505]">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
