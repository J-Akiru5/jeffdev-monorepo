import { getKpis, getMarketingPhases, getMarketingTaskStats } from "@/app/actions/marketing";
import { KpiCards } from "@/components/marketing/kpi-cards";
import { ProgressBar } from "@syntaxure/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MarketingDashboardPage() {
  const [kpis, phases, stats] = await Promise.all([
    getKpis(),
    getMarketingPhases(),
    getMarketingTaskStats(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Marketing Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">
          Syntaxure Labs — Prism Context Engine GTM
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-mono uppercase tracking-wider text-white/40">
          Key Performance Indicators
        </h2>
        <KpiCards kpis={kpis} />
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-mono uppercase tracking-wider text-white/40">
          Phase Progress
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase) => {
            const phaseStats = stats.byPhase[phase.id] || {
              total: 0,
              done: 0,
            };
            const percent =
              phaseStats.total > 0
                ? Math.round((phaseStats.done / phaseStats.total) * 100)
                : 0;

            return (
              <Link
                key={phase.id}
                href={`/marketing/tasks?phase=${phase.id}`}
                className="glass rounded-lg p-4 transition-all hover:border-cyan-500/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        phase.color === "cyan"
                          ? "#06b6d4"
                          : phase.color === "purple"
                            ? "#8b5cf6"
                            : phase.color === "emerald"
                              ? "#10b981"
                              : "#f59e0b",
                    }}
                  />
                  <h3 className="text-sm font-semibold text-white">
                    {phase.name}
                  </h3>
                </div>
                <p className="text-xs text-white/40 mb-3">{phase.timeframe}</p>
                <ProgressBar
                  value={percent}
                  size="sm"
                  showLabel={false}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-white/50">
                    {phaseStats.done}/{phaseStats.total} done
                  </span>
                  <span className="text-xs text-white/30">{percent}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-white/40">
            Status Overview
          </h2>
          <Link
            href="/marketing/tasks"
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View All Tasks →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass rounded-lg p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-white/50">
              To Do
            </p>
            <p className="mt-2 text-3xl font-bold text-white/30">
              {stats.byStatus.todo || 0}
            </p>
          </div>
          <div className="glass rounded-lg p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              In Progress
            </p>
            <p className="mt-2 text-3xl font-bold text-cyan-400">
              {stats.byStatus["in-progress"] || 0}
            </p>
          </div>
          <div className="glass rounded-lg p-4">
            <p className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              Done
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {stats.byStatus.done || 0}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
