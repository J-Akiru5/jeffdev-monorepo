"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Globe,
  GitBranch,
  Plug,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Terminal,
  ChevronRight,
  Code2,
  Layers,
  Box,
} from "lucide-react";
import { GlassPanel, Button } from "@jdstudio/ui";

// ─── Step types ──────────────────────────────────────────────────────────────

type StepId = "welcome" | "scan" | "connect" | "done";

const STEPS: { id: StepId; label: string }[] = [
  { id: "welcome", label: "Project" },
  { id: "scan", label: "Extract Rules" },
  { id: "connect", label: "Connect IDE" },
  { id: "done", label: "Ready" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Onboarding Wizard
 * Shown to new users on first login. Guides them from project creation
 * to working MCP connection in under 60 seconds.
 */
export default function OnboardingPage() {
  const [step, setStep] = useState<StepId>("welcome");
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [scanUrl, setScanUrl] = useState("");
  const [stack, setStack] = useState("nextjs");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim(), stack, designSystem: "jdstudio" }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjectSlug(data.slug || projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
        setStep("scan");
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 mb-6">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">
            Let&apos;s get you set up
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
          Welcome to Prism
        </h1>
        <p className="text-white/50 max-w-md">
          Extract your architecture rules and connect your AI assistant. Takes about 60 seconds.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  i < currentStepIndex
                    ? "bg-cyan-500 text-black"
                    : i === currentStepIndex
                    ? "border-2 border-cyan-500 text-cyan-400"
                    : "border border-white/10 text-white/30"
                }`}
              >
                {i < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  i === currentStepIndex ? "text-white" : "text-white/30"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-8 sm:w-16 mx-1 transition-all ${
                    i < currentStepIndex ? "bg-cyan-500" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="w-full max-w-lg">
        {step === "welcome" && (
          <StepWelcome
            projectName={projectName}
            setProjectName={setProjectName}
            stack={stack}
            setStack={setStack}
            onNext={handleCreateProject}
            isPending={isPending}
            onSkip={() => router.push("/dashboard")}
          />
        )}
        {step === "scan" && (
          <StepScan
            projectSlug={projectSlug}
            scanUrl={scanUrl}
            setScanUrl={setScanUrl}
            onNext={() => setStep("connect")}
            onSkip={() => setStep("connect")}
          />
        )}
        {step === "connect" && (
          <StepConnect
            onNext={() => setStep("done")}
            onSkip={() => setStep("done")}
          />
        )}
        {step === "done" && (
          <StepDone projectSlug={projectSlug} router={router} />
        )}
      </div>

      {/* Skip entire onboarding */}
      {step !== "done" && (
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-8 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Skip setup — I&apos;ll configure this later
        </button>
      )}
    </div>
  );
}

// ─── Step 1: Welcome / Project Creation ──────────────────────────────────────

function StepWelcome({
  projectName,
  setProjectName,
  stack,
  setStack,
  onNext,
  isPending,
  onSkip,
}: {
  projectName: string;
  setProjectName: (v: string) => void;
  stack: string;
  setStack: (v: string) => void;
  onNext: () => void;
  isPending: boolean;
  onSkip: () => void;
}) {
  const stacks = [
    { id: "nextjs", label: "Next.js", icon: <Layers className="h-4 w-4" /> },
    { id: "react", label: "React", icon: <Code2 className="h-4 w-4" /> },
    { id: "react-native", label: "React Native", icon: <Box className="h-4 w-4" /> },
  ];

  return (
    <GlassPanel className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Layers className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Name your project</h2>
          <p className="text-sm text-white/50">This organises your rules in Prism.</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && projectName.trim() && onNext()}
            placeholder="e.g., My SaaS App"
            autoFocus
            className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Primary Stack
          </label>
          <div className="grid grid-cols-3 gap-3">
            {stacks.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStack(s.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-md border transition-all ${
                  stack === s.id
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                    : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white"
                }`}
              >
                {s.icon}
                <span className="text-xs font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={onSkip}
            className="text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            Skip
          </button>
          <Button
            variant="primary"
            onClick={onNext}
            disabled={!projectName.trim() || isPending}
            className="flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
}

// ─── Step 2: Rule Extraction ──────────────────────────────────────────────────

function StepScan({
  projectSlug,
  scanUrl,
  setScanUrl,
  onNext,
  onSkip,
}: {
  projectSlug: string;
  scanUrl: string;
  setScanUrl: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <GlassPanel className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Globe className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Extract your rules</h2>
          <p className="text-sm text-white/50">
            Prism scans your site and auto-generates rules from it.
          </p>
        </div>
      </div>

      {/* Option A: URL Scan */}
      <div className="rounded-md border border-white/10 p-5 mb-4 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Scan your site</span>
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Recommended</span>
        </div>
        <p className="text-xs text-white/50 mb-3">
          Start your dev server, paste the URL — Prism crawls it with Playwright and generates 15–25 rules in ~30s.
        </p>
        <input
          type="url"
          value={scanUrl}
          onChange={(e) => setScanUrl(e.target.value)}
          placeholder="http://localhost:3000"
          className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors font-mono"
        />
        <p className="text-xs text-white/30 mt-2">
          Run this in your terminal after:
          <code className="ml-1 font-mono bg-white/5 px-1.5 py-0.5 rounded text-cyan-300">
            prism connect --url {scanUrl || "http://localhost:3000"}
          </code>
        </p>
      </div>

      {/* Option B: Repo scan */}
      <div className="rounded-md border border-white/10 p-5 mb-4 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Scan your repo</span>
        </div>
        <p className="text-xs text-white/50 mb-3">
          Extracts naming conventions and import patterns from your codebase files.
        </p>
        <code className="block text-xs text-emerald-300 bg-black/30 border border-white/5 rounded p-3 font-mono">
          prism sync --repo ./
        </code>
      </div>

      {/* Option C: Manual */}
      <div className="rounded-md border border-white/10 p-5 mb-6 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Create rules manually</span>
        </div>
        <p className="text-xs text-white/50">
          Write rules by hand in the dashboard.{" "}
          <Link
            href={`/projects/${projectSlug}`}
            className="text-cyan-400 hover:underline"
          >
            Go to project →
          </Link>
        </p>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onSkip}
          className="text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          Skip for now
        </button>
        <Button variant="primary" onClick={onNext} className="flex items-center gap-2">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </GlassPanel>
  );
}

// ─── Step 3: Connect IDE ──────────────────────────────────────────────────────

function StepConnect({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [activeTab, setActiveTab] = useState<"auto" | "cursor" | "vscode" | "windsurf">("auto");

  const tabs = [
    { id: "auto" as const, label: "Auto (Recommended)" },
    { id: "cursor" as const, label: "Cursor" },
    { id: "vscode" as const, label: "VS Code" },
    { id: "windsurf" as const, label: "Windsurf" },
  ];

  return (
    <GlassPanel className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Plug className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Connect your IDE</h2>
          <p className="text-sm text-white/50">
            Let your AI assistant access your rules via MCP.
          </p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-md mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === t.id
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "auto" && (
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            Run this once — it detects your editors and writes the config automatically:
          </p>
          <div className="bg-black/40 border border-white/10 rounded-md p-4 font-mono text-sm">
            <p className="text-white/40 text-xs mb-2"># Install CLI (if not done)</p>
            <p className="text-emerald-300">npm install -g @prism-engine/cli</p>
            <p className="text-white/40 text-xs mt-3 mb-2"># Sync rules + configure IDE</p>
            <p className="text-cyan-300">prism sync</p>
            <p className="text-cyan-300">prism init</p>
          </div>
          <p className="text-xs text-white/40">
            Then restart your editor. Your AI now has Prism as an MCP tool.
          </p>
        </div>
      )}

      {activeTab === "cursor" && (
        <div className="space-y-3">
          <p className="text-xs text-white/50">Create <code className="text-white/80 font-mono">.cursor/mcp.json</code> in your project root:</p>
          <pre className="bg-black/40 border border-white/10 rounded-md p-4 text-xs text-white/80 font-mono overflow-x-auto">{`{
  "mcpServers": {
    "prism": {
      "command": "prism",
      "args": ["serve"],
      "env": {
        "PRISM_API_KEY": "pk_live_YOUR_KEY"
      }
    }
  }
}`}</pre>
          <p className="text-xs text-white/30">Get your API key: Settings → API Keys → Generate Key (Pro plan)</p>
        </div>
      )}

      {activeTab === "vscode" && (
        <div className="space-y-3">
          <p className="text-xs text-white/50">Add to VS Code <code className="text-white/80 font-mono">settings.json</code>:</p>
          <pre className="bg-black/40 border border-white/10 rounded-md p-4 text-xs text-white/80 font-mono overflow-x-auto">{`{
  "mcp": {
    "servers": {
      "prism": {
        "type": "stdio",
        "command": "prism",
        "args": ["serve"],
        "env": {
          "PRISM_API_KEY": "pk_live_YOUR_KEY"
        }
      }
    }
  }
}`}</pre>
        </div>
      )}

      {activeTab === "windsurf" && (
        <div className="space-y-3">
          <p className="text-xs text-white/50">In Windsurf: Settings → MCP Servers → Add Server:</p>
          <div className="bg-black/40 border border-white/10 rounded-md p-4 text-xs font-mono space-y-1">
            <p><span className="text-white/40">Name:</span> <span className="text-white">prism</span></p>
            <p><span className="text-white/40">Command:</span> <span className="text-cyan-300">prism</span></p>
            <p><span className="text-white/40">Args:</span> <span className="text-cyan-300">serve</span></p>
            <p><span className="text-white/40">Env:</span> <span className="text-emerald-300">PRISM_API_KEY=pk_live_...</span></p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={onSkip}
          className="text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          I&apos;ll do this later
        </button>
        <Button variant="primary" onClick={onNext} className="flex items-center gap-2">
          I&apos;ve connected it
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </GlassPanel>
  );
}

// ─── Step 4: Done ─────────────────────────────────────────────────────────────

function StepDone({
  projectSlug,
  router,
}: {
  projectSlug: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <GlassPanel className="p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/30 mx-auto mb-6">
        <CheckCircle2 className="h-8 w-8 text-cyan-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">You&apos;re ready!</h2>
      <p className="text-white/50 max-w-sm mx-auto mb-8">
        Prism is configured. Ask your AI assistant{" "}
        <em className="text-white/80">&quot;What are the architectural rules for this project?&quot;</em>{" "}
        to verify the connection.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {projectSlug && (
          <Button variant="primary" onClick={() => router.push(`/projects/${projectSlug}`)} className="flex items-center gap-2">
            View My Project
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
        {[
          { label: "Docs", href: "https://docs.prism.jeffdev.studio", icon: "📚" },
          { label: "Quick Connect", href: "/quickstart", icon: "⚡" },
          { label: "CLI Reference", href: "https://docs.prism.jeffdev.studio/cli-reference", icon: "🖥️" },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-2 p-3 rounded-md border border-white/5 hover:border-white/10 transition-colors text-white/50 hover:text-white"
          >
            <span className="text-xl">{link.icon}</span>
            <span className="text-xs font-medium">{link.label}</span>
          </a>
        ))}
      </div>
    </GlassPanel>
  );
}
