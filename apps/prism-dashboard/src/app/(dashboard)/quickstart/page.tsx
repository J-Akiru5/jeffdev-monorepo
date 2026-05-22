"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Terminal,
  Copy,
  Check,
  Plug,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Info,
} from "lucide-react";
import { GlassPanel, Button, Badge } from "@jdstudio/ui";

type IdeId = "cursor" | "vscode" | "windsurf" | "claude";

const IDES: { id: IdeId; label: string; description: string; configFile: string }[] = [
  { id: "cursor", label: "Cursor", description: "AI-first code editor", configFile: ".cursor/mcp.json" },
  { id: "vscode", label: "VS Code", description: "settings.json → mcp.servers", configFile: "settings.json" },
  { id: "windsurf", label: "Windsurf", description: "Codeium's AI editor", configFile: "Windsurf Settings" },
  { id: "claude", label: "Claude Desktop", description: "claude_desktop_config.json", configFile: "claude_desktop_config.json" },
];

function getIdeConfig(ide: IdeId, apiKey: string): string {
  const key = apiKey || "pk_live_YOUR_KEY_HERE";
  switch (ide) {
    case "cursor":
      return JSON.stringify(
        { mcpServers: { prism: { command: "prism", args: ["serve"], env: { PRISM_API_KEY: key } } } },
        null,
        2
      );
    case "vscode":
      return JSON.stringify(
        { mcp: { servers: { prism: { type: "stdio", command: "prism", args: ["serve"], env: { PRISM_API_KEY: key } } } } },
        null,
        2
      );
    case "windsurf":
      return `Name:    prism
Command: prism
Args:    serve
Env:     PRISM_API_KEY=${key}`;
    case "claude":
      return JSON.stringify(
        { mcpServers: { prism: { command: "prism", args: ["serve"], env: { PRISM_API_KEY: key } } } },
        null,
        2
      );
  }
}

/**
 * Quick Connect Page
 * Shows IDE MCP configuration snippets with the user's actual API key pre-filled.
 * Accessible at any time from sidebar — not just during onboarding.
 */
export default function QuickConnectPage() {
  const [activeIde, setActiveIde] = useState<IdeId>("cursor");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyPrefix, setApiKeyPrefix] = useState("");
  const [hasPro, setHasPro] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load API keys
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/api-keys");
        if (res.ok) {
          const data = await res.json();
          setHasPro(data.limit > 0);
          if (data.keys?.length > 0) {
            setApiKeyPrefix(data.keys[0].keyPrefix);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const config = getIdeConfig(activeIde, apiKey);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
          <Plug className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Quick Connect</h1>
          <p className="text-white/50 mt-1">
            Configure your IDE to use Prism as an MCP context server — once, and it just works.
          </p>
        </div>
      </div>

      {/* Step 1: Install CLI */}
      <GlassPanel className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">1</div>
          <h2 className="text-base font-semibold text-white">Install the CLI</h2>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-md p-4 flex items-center justify-between gap-4">
          <code className="text-sm font-mono text-emerald-300">npm install -g @prism-engine/cli</code>
          <button
            onClick={() => handleCopy("npm install -g @prism-engine/cli", "install")}
            className="text-white/30 hover:text-white transition-colors flex-shrink-0"
          >
            {copied === "install" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-white/30 mt-2">
          Verify: <code className="text-white/50 font-mono">prism --version</code>
        </p>
      </GlassPanel>

      {/* Step 2: Sync rules */}
      <GlassPanel className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">2</div>
          <h2 className="text-base font-semibold text-white">Sync your rules</h2>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-md p-4 flex items-center justify-between gap-4">
          <code className="text-sm font-mono text-cyan-300">prism sync</code>
          <button
            onClick={() => handleCopy("prism sync", "sync")}
            className="text-white/30 hover:text-white transition-colors flex-shrink-0"
          >
            {copied === "sync" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-white/30 mt-2">
          Downloads your rules to <code className="text-white/50 font-mono">~/.prism/rules.json</code>
        </p>
      </GlassPanel>

      {/* Step 3: Auto-init */}
      <GlassPanel className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">3</div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Auto-configure your IDE</h2>
            <Badge variant="success">Recommended</Badge>
          </div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-md p-4 flex items-center justify-between gap-4">
          <code className="text-sm font-mono text-emerald-300">prism init</code>
          <button
            onClick={() => handleCopy("prism init", "init")}
            className="text-white/30 hover:text-white transition-colors flex-shrink-0"
          >
            {copied === "init" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-white/30 mt-2">
          Auto-detects Cursor, VS Code, Windsurf, Claude Desktop and writes the correct config for each. Then restart your editor.
        </p>
      </GlassPanel>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-white/5" />
        <span className="text-xs text-white/30 font-mono">OR configure manually</span>
        <div className="flex-1 border-t border-white/5" />
      </div>

      {/* Step 3 Alt: Manual config */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Manual IDE Config</h2>
          {!hasPro && !loading && (
            <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-1.5">
              <Info className="h-3 w-3" />
              <span>API keys require Pro plan</span>
              <Link href="/subscription" className="underline hover:text-amber-300">Upgrade</Link>
            </div>
          )}
        </div>

        {/* Your API Key display */}
        {!loading && apiKeyPrefix && (
          <GlassPanel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-1">Your API Key</p>
                <p className="text-sm font-mono text-white">
                  {apiKeyPrefix}
                  <span className="text-white/30">••••••••</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/settings" className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Manage keys
                </Link>
              </div>
            </div>
          </GlassPanel>
        )}

        {/* Optional: paste full key to pre-fill configs */}
        <div>
          <label className="block text-xs text-white/40 font-medium mb-2">
            Paste your full API key to pre-fill the configs below (optional)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="pk_live_..."
            className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white text-sm placeholder:text-white/30 font-mono focus:border-cyan-500/50 focus:outline-none transition-colors"
          />
        </div>

        {/* IDE tabs */}
        <div className="flex gap-2 flex-wrap">
          {IDES.map((ide) => (
            <button
              key={ide.id}
              onClick={() => setActiveIde(ide.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all border ${
                activeIde === ide.id
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-white/5 text-white/40 hover:border-white/10 hover:text-white/70"
              }`}
            >
              {ide.label}
            </button>
          ))}
        </div>

        {/* Config block */}
        <GlassPanel className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div>
              <span className="text-xs font-mono text-white/60">
                {IDES.find((i) => i.id === activeIde)?.configFile}
              </span>
              <span className="text-xs text-white/30 ml-3">
                {IDES.find((i) => i.id === activeIde)?.description}
              </span>
            </div>
            <button
              onClick={() => handleCopy(config, "config")}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              {copied === "config" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="p-5 text-sm font-mono text-white/80 overflow-x-auto leading-relaxed whitespace-pre">
            {config}
          </pre>
        </GlassPanel>

        <p className="text-xs text-white/30">
          After pasting the config, restart your IDE. Then ask your AI:{" "}
          <em className="text-white/50">&quot;What are my architectural rules?&quot;</em>
        </p>
      </div>

      {/* Footer links */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
        <Button variant="secondary" size="sm" asChild>
          <a href="https://docs.prism.jeffdev.studio/ide-setup" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Full IDE Setup Guide
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <a href="https://docs.prism.jeffdev.studio/troubleshooting" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            Troubleshooting
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/onboarding" className="flex items-center gap-2">
            Run Setup Wizard
          </Link>
        </Button>
      </div>
    </div>
  );
}
