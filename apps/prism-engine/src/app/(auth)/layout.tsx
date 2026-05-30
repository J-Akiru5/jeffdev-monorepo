import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SyntaxureLogo } from "@syntaxure/ui";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Brand showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[var(--bg-primary)] p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.1),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-subtle)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <SyntaxureLogo className="h-10 w-10 drop-shadow-[0_0_20px_rgba(0,229,255,0.15)]" />
            <span className="text-xl font-bold text-[var(--text-primary)]">
              Syntaxure Labs
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-[var(--text-primary)]">
              The Context Operating System
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-violet-500 dark:from-cyan-400 dark:to-violet-400 bg-clip-text text-transparent">
                for AI-Native Teams
              </span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-md leading-relaxed">
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
                <div key={feature} className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-cyan-400" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-[var(--text-tertiary)]">
          &copy; {new Date().getFullYear()} Syntaxure Labs. All rights reserved.
        </div>
      </div>

      {/* Right: Auth content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--bg-primary)] relative">
        <Link
          href="/"
          className="absolute top-6 right-6 lg:top-8 lg:right-12 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
