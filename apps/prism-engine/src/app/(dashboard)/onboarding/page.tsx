"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Zap,
} from "lucide-react";
import { GlassPanel, Button } from "@syntaxure/ui";

/**
 * Stupid Simple Onboarding
 * ------------------------
 * ONE step: Name your project → Done.
 * Auto-creates with smart defaults (Next.js, JDStudio).
 * Takes 10 seconds max.
 */
export default function OnboardingPage() {
  const [projectName, setProjectName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isComplete, setIsComplete] = useState(false);
  const [projectSlug, setProjectSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if already completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem("prism_onboarded");
    if (completed) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: projectName.trim(),
            stack: "nextjs",
            designSystem: "jdstudio",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const slug = data.slug || projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          setProjectSlug(slug);
          localStorage.setItem("prism_onboarded", "true");
          setIsComplete(true);
        } else {
          setError("Failed to create project. Please try again.");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  // Success state
  if (isComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 mb-6">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">
              All set
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
            You&apos;re ready!
          </h1>
          <p className="text-white/50 max-w-md mx-auto">
            Project <span className="text-white/80 font-medium">{projectName}</span> is created.
            Extract rules and connect your IDE anytime from the dashboard.
          </p>
        </div>

        <GlassPanel className="p-8 w-full max-w-lg">
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => router.push(`/projects/${projectSlug}`)}
              className="flex items-center justify-center gap-2 w-full"
            >
              <Zap className="h-4 w-4" />
              View My Project
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs text-white/30 text-center mb-3">
              Quick setup when you&apos;re ready:
            </p>
            <div className="bg-black/40 border border-white/10 rounded-md p-3 font-mono text-xs">
              <p className="text-white/40">$ npm install -g prism-context-engine</p>
              <p className="text-cyan-300">$ prism sync</p>
              <p className="text-cyan-300">$ prism init</p>
            </div>
          </div>
        </GlassPanel>
      </div>
    );
  }

  // Main onboarding - single step
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 mb-6">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">
            10 seconds setup
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
          Welcome to Prism
        </h1>
        <p className="text-white/50 max-w-md">
          Name your project and you&apos;re in. Extract rules and connect your IDE later.
        </p>
      </div>

      {/* Single Step: Name Project */}
      <GlassPanel className="p-8 w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Name your project
            </h2>
            <p className="text-sm text-white/50">
              We&apos;ll set everything up with smart defaults.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && projectName.trim() && handleCreateProject()
              }
              placeholder="e.g., My SaaS App"
              autoFocus
              className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors text-lg"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              Skip
            </button>
            <Button
              variant="primary"
              onClick={handleCreateProject}
              disabled={!projectName.trim() || isPending}
              className="flex items-center gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create Project
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-xs text-white/30 text-center">
            Auto-configured with Next.js + JDStudio design system.
            <br />
            Change anything later from your project settings.
          </p>
        </div>
      </GlassPanel>

      {/* Skip entire onboarding */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-6 text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        Skip setup — I&apos;ll configure this later
      </button>
    </div>
  );
}
