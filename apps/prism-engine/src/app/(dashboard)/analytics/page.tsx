"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Activity,
  ArrowLeft,
  FileJson,
  Sparkles,
  Monitor,
  Zap,
  DollarSign,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { GlassPanel, MetricTile, SectionHeader } from "@syntaxure/ui";

// ─────────────────────────────────────────────────────────────────────────────
// Types (matching /api/v1/analytics response)
// ─────────────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  tier: string;
  usage: {
    projects: { used: number; limit: number | string };
    rules: { used: number; limit: number | string };
    components: { used: number; limit: number | string };
    aiGenerations: { used: number; limit: number | string };
  };
  telemetry: {
    tokensThisMonth: number;
    totalCalls: number;
    errorCalls: number;
    cacheHitCalls?: number;
    cacheHitRate?: number;
    callsByPlatform?: Record<string, number>;
    tokensByTool?: Record<string, number>;
    tokensByProject?: Record<string, number>;
    costEstimate: number;
  };
  resetDate: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/analytics");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { data: AnalyticsData };
      setData(json.data ?? json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const tel = data?.telemetry;
  const usage = data?.usage;
  const tier = data?.tier ?? "free";

  const formatLimit = (v: number | string) =>
    v === -1 || v === "unlimited" ? "∞" : String(v);
  const pct = (used: number, limit: number | string) => {
    if (limit === -1 || limit === "unlimited") return 0;
    return Math.min(100, (used / Number(limit)) * 100);
  };

  const tierColor =
    tier === "enterprise"
      ? "text-amber-400"
      : tier === "team"
        ? "text-purple-400"
        : tier === "pro"
          ? "text-cyan-400"
          : "text-white/50";

  return (
    <div className="space-y-8">
      {/* Back + Refresh */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 mb-4">
          <BarChart3 className="h-3 w-3 text-amber-400" />
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
            Analytics
          </span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Usage & Analytics</h1>
            <p className="text-white/60 mt-1">
              MCP calls, token usage, and plan consumption.{" "}
              <span className="font-mono text-xs text-white/30">
                Resets{" "}
                {data?.resetDate
                  ? new Date(data.resetDate).toLocaleDateString()
                  : "monthly"}
              </span>
            </p>
          </div>
          <span
            className={`font-mono text-sm font-semibold uppercase ${tierColor} border border-current/30 rounded-full px-3 py-1`}
          >
            {tier} plan
          </span>
        </div>
      </div>

      {/* Loading/Error */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-white/30" />
        </div>
      )}
      {error && !loading && (
        <GlassPanel className="p-6 border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={load}
            className="mt-2 text-xs text-white/50 hover:text-white underline"
          >
            Retry
          </button>
        </GlassPanel>
      )}

      {data && !loading && (
        <>
          {/* Top Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="MCP Calls / Month"
              value={tel?.totalCalls ?? 0}
              icon={Zap}
              intent="cyan"
            />
            <MetricTile
              label="Tokens Used"
              value={
                tel?.tokensThisMonth
                  ? tel.tokensThisMonth >= 1_000_000
                    ? `${(tel.tokensThisMonth / 1_000_000).toFixed(1)}M`
                    : tel.tokensThisMonth >= 1_000
                      ? `${(tel.tokensThisMonth / 1_000).toFixed(1)}K`
                      : String(tel.tokensThisMonth)
                  : "0"
              }
              icon={Activity}
              intent="purple"
            />
            <MetricTile
              label="Estimated Cost"
              value={`$${(tel?.costEstimate ?? 0).toFixed(2)}`}
              icon={DollarSign}
              intent="default"
            />
            <MetricTile
              label="Cache Hit Rate"
              value={
                tel?.totalCalls
                  ? `${Math.round((tel.cacheHitRate ?? 0) * 100 || ((tel.cacheHitCalls ?? 0) / tel.totalCalls) * 100)}%`
                  : "—"
              }
              icon={CheckCircle2}
              intent="default"
            />
          </div>

          {/* Plan Usage + MCP breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Plan Limits */}
            <GlassPanel className="p-6">
              <SectionHeader title="Plan Limits" kicker={month} />
              <div className="mt-6 space-y-5">
                {(
                  [
                    {
                      label: "Projects",
                      key: "projects",
                      color: "from-cyan-500 to-blue-500",
                    },
                    {
                      label: "Rules",
                      key: "rules",
                      color: "from-purple-500 to-pink-500",
                    },
                    {
                      label: "AI Generations",
                      key: "aiGenerations",
                      color: "from-amber-500 to-orange-500",
                    },
                    {
                      label: "Components",
                      key: "components",
                      color: "from-emerald-500 to-teal-500",
                    },
                  ] as const
                ).map(({ label, key, color }) => {
                  const u = usage?.[key] ?? { used: 0, limit: 0 };
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white/70">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {u.used}
                          </span>
                          <span className="text-xs text-white/30">
                            / {formatLimit(u.limit)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`}
                          style={{ width: `${pct(u.used, u.limit)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>

            {/* MCP Tool Breakdown */}
            <GlassPanel className="p-6">
              <SectionHeader title="MCP Tool Usage" kicker="Tokens by tool" />
              <div className="mt-6">
                {tel?.tokensByTool &&
                Object.keys(tel.tokensByTool).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(tel.tokensByTool)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([tool, tokens]) => {
                        const total = tel.tokensThisMonth || 1;
                        const percent = Math.round((tokens / total) * 100);
                        return (
                          <div key={tool}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono text-white/60 truncate max-w-[180px]">
                                {tool}
                              </span>
                              <span className="text-xs text-white/40 ml-2 flex-shrink-0">
                                {tokens.toLocaleString()} tok · {percent}%
                              </span>
                            </div>
                            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500/50 to-cyan-500 transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Zap className="h-8 w-8 text-white/10 mb-3" />
                    <p className="text-sm text-white/30">
                      No MCP calls yet this month.
                    </p>
                    <p className="text-xs text-white/20 mt-1">
                      Connect your IDE and run{" "}
                      <code className="font-mono">prism serve</code>.
                    </p>
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>

          {/* IDE Platform + Error Rate */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Platforms */}
            <GlassPanel className="p-6">
              <SectionHeader title="IDE Platforms" kicker="Calls by editor" />
              <div className="mt-6">
                {tel?.callsByPlatform &&
                Object.keys(tel.callsByPlatform).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(tel.callsByPlatform)
                      .sort(([, a], [, b]) => b - a)
                      .map(([platform, calls]) => {
                        const total = tel.totalCalls || 1;
                        const percent = Math.round((calls / total) * 100);
                        const label =
                          platform === "claude_desktop"
                            ? "Claude Desktop"
                            : platform.charAt(0).toUpperCase() +
                              platform.slice(1);
                        return (
                          <div
                            key={platform}
                            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                          >
                            <span className="text-sm text-white/70">
                              {label}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-purple-500/50 to-purple-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-white/40 w-8 text-right">
                                {calls}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Monitor className="h-8 w-8 text-white/10 mb-3" />
                    <p className="text-sm text-white/30">
                      No IDE connections detected.
                    </p>
                    <Link
                      href="/quickstart"
                      className="text-xs text-cyan-400 mt-1 hover:underline"
                    >
                      Connect your IDE →
                    </Link>
                  </div>
                )}
              </div>
            </GlassPanel>

            {/* Health */}
            <GlassPanel className="p-6">
              <SectionHeader title="Health" kicker="This month" />
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-white/70">
                      Successful Calls
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-emerald-400">
                    {(
                      (tel?.totalCalls ?? 0) - (tel?.errorCalls ?? 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-white/70">Failed Calls</span>
                  </div>
                  <span
                    className={`font-mono font-semibold ${(tel?.errorCalls ?? 0) > 0 ? "text-red-400" : "text-white/30"}`}
                  >
                    {(tel?.errorCalls ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-white/70">Cache Hits</span>
                  </div>
                  <span className="font-mono font-semibold text-amber-400">
                    {(tel?.cacheHitCalls ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <FileJson className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-white/70">Rules Active</span>
                  </div>
                  <span className="font-mono font-semibold text-white">
                    {usage?.rules.used ?? 0}
                  </span>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Upgrade CTA (free tier only) */}
          {tier === "free" && (
            <GlassPanel className="p-6 border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-transparent">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="font-medium text-white">
                    Unlock Full MCP Analytics
                  </p>
                  <p className="text-sm text-white/50 mt-1">
                    Pro plan gives you per-project token breakdowns, 90-day
                    history, and cost alerts.
                  </p>
                </div>
                <Link
                  href="/subscription"
                  className="flex-shrink-0 inline-flex items-center gap-2 rounded-md bg-cyan-500 hover:bg-cyan-400 transition-colors px-4 py-2 text-sm font-semibold text-black"
                >
                  <Sparkles className="h-4 w-4" />
                  Upgrade
                </Link>
              </div>
            </GlassPanel>
          )}
        </>
      )}
    </div>
  );
}
