import { getMilestones, getMilestoneStats } from "@/app/actions/milestones";
import { getCostSummary } from "@/app/actions/infrastructure-costs";
import MilestoneStatusBadge from "./milestone-status-badge";
import Link from "next/link";

interface OperationsPageProps {
  searchParams: Promise<{ period?: string; workspaceId?: string }>;
}

export default async function OperationsPage({ searchParams }: OperationsPageProps) {
  const params = await searchParams;
  const workspaceId = params.workspaceId || ""; 
  const currentPeriod = params.period || new Date().toISOString().substring(0, 7); // e.g., "2026-06"

  // Sabay-sabay na kukunin ang data mula sa mga ginawa nating server actions
  const [milestones, stats, costs] = await Promise.all([
    getMilestones(workspaceId).catch(() => []),
    getMilestoneStats(workspaceId).catch(() => ({ pending: 0, in_progress: 0, completed: 0, blocked: 0 })),
    getCostSummary(workspaceId, currentPeriod).catch(() => ({ totalBudget: 0, totalSpend: 0, byCategory: {} }))
  ]);

  const totalMilestones = milestones.length;
  const completionRate = totalMilestones > 0 
    ? Math.round((stats.completed / totalMilestones) * 100) 
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Operations Hub
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Monitor infrastructure spending, internal task throughput, and corporate milestones.
          </p>
        </div>
        <Link 
          href="/operations/milestones"
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-lg border border-zinc-700 transition"
        >
          Manage Milestones →
        </Link>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Completion Rate</p>
          <p className="text-3xl font-bold text-cyan-400 mt-2">{completionRate}%</p>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Active Milestones</p>
          <p className="text-3xl font-bold mt-2">{stats.in_progress + stats.pending}</p>
          <p className="text-xs text-zinc-500 mt-2">{stats.completed} milestones fully resolved</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Blocked Items</p>
          <p className={`text-3xl font-bold mt-2 ${stats.blocked > 0 ? "text-rose-400" : "text-zinc-400"}`}>{stats.blocked}</p>
          <p className="text-xs text-zinc-500 mt-2">Requires immediate founder intervention</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Monthly Burn ({currentPeriod})</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">${costs.totalSpend}</p>
          <p className="text-xs text-zinc-500 mt-2">Budgeted cap: ${costs.totalBudget}</p>
        </div>
      </div>

      {/* Main Core Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Milestone Overview */}
        <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Strategic Milestones Track</h3>
          <div className="divide-y divide-zinc-800/60">
            {milestones.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">No corporate milestones found for this workspace.</p>
            ) : (
              milestones.map((m) => (
                <div key={m.id} className="py-4 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-200">{m.title}</p>
                    {m.description && <p className="text-xs text-zinc-400 max-w-md">{m.description}</p>}
                    {m.dueDate && <p className="text-[10px] font-mono text-zinc-500">Due: {m.dueDate}</p>}
                  </div>
                  <MilestoneStatusBadge status={m.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Infrastructure Burn Breakdown */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Infrastructure Budget Details</h3>
          <div className="space-y-4 pt-2">
            {Object.keys(costs.byCategory).length === 0 ? (
              <p className="text-sm text-zinc-500">No cost data reported for this tracking cycle.</p>
            ) : (
              Object.entries(costs.byCategory).map(([cat, val]) => {
                const pct = val.budget > 0 ? Math.min(Math.round((val.spend / val.budget) * 100), 100) : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="capitalize text-zinc-300">{cat.replace("_", " ")}</span>
                      <span className="text-zinc-400">${val.spend} / ${val.budget}</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-rose-500" : pct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}