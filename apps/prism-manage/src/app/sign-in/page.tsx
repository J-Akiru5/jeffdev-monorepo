import { SyntaxureLogo, GridBackground } from "@syntaxure/ui";
import { SignInForm } from "@/components/auth/sign-in-form";
import type { Metadata } from "next";
import { Code2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Access Portal",
  description:
    "Sign in or register for Syntaxure Labs — Enterprise Web Development & SaaS Solutions.",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen lg:h-screen grid grid-cols-1 lg:grid-cols-2 bg-void lg:overflow-hidden">
      {/* ── Left: Syntaxure Labs Branding ── */}
      <div className="relative hidden lg:flex flex-col justify-center items-center p-12 lg:p-16 border-r border-white/[0.04] overflow-hidden h-full">
        {/* Grid + Glow Background */}
        <GridBackground variant="neon" />

        {/* Content */}
        <div className="relative z-10 max-w-lg text-center">
          {/* Logo */}
          <div className="mb-8 inline-flex">
            <SyntaxureLogo className="w-28 h-28 drop-shadow-[0_0_30px_rgba(0,229,255,0.15)] animate-neon-pulse" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Syntaxure Labs
          </h1>

          {/* Tagline */}
          <p className="mt-4 text-base text-white/50 leading-relaxed">
            Enterprise Web Development & SaaS Solutions.
            <br />
            Build high-performance systems that scale.
          </p>

          {/* Divider */}
          <div className="my-8 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
            <Code2 className="h-4 w-4 text-white/20" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
          </div>

          {/* Value Props */}
          <div className="space-y-3 text-left">
            {[
              {
                label: "Zero-to-One",
                desc: "From concept to production-grade systems",
              },
              {
                label: "Fixed Investment",
                desc: "No surprises. Scoped, quoted, delivered.",
              },
              {
                label: "AI-Native",
                desc: "Modern architecture with AI at the core",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 group"
              >
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-500/60 group-hover:bg-cyan-400 transition-colors shrink-0" />
                <div>
                  <span className="text-sm font-medium text-white/80 font-mono">
                    {item.label}
                  </span>
                  <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom watermark */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/10">
            Est. 2025 &middot; Built with Next.js
          </p>
        </div>
      </div>

      {/* ── Right: Auth Form ── */}
      <div className="relative flex items-center justify-center min-h-screen lg:min-h-0 lg:h-full lg:overflow-y-auto p-6 lg:p-12">
        {/* Mobile branding (visible on small screens) */}
        <div className="lg:hidden absolute top-8 left-0 right-0 flex flex-col items-center gap-2">
          <SyntaxureLogo className="w-12 h-12 animate-neon-pulse" />
          <h1 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
            Syntaxure Labs
          </h1>
          <p className="text-xs text-white/40">Access Portal</p>
        </div>

        {/* Grid background for right side */}
        <div className="fixed inset-0 -z-10 lg:hidden">
          <GridBackground variant="neon" />
        </div>

        {/* Dark overlay gradient for visual separation */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-transparent via-surface/80 to-surface lg:hidden" />

        <div className="w-full pt-20 lg:pt-0 pb-10 lg:pb-0">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
