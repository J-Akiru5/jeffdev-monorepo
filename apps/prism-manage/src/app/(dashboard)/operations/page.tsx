"use client";

/**
 * Operations Hub (/operations)
 * ----------------------------
 * COO command center: milestone health, task throughput, resource
 * allocation, and infrastructure spend. CEO/COO only (guarded client-side;
 * server actions enforce independently).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  LayoutGrid,
  Target,
} from "lucide-react";
import { OperationsGuard } from "@/components/operations-guard";
import {
  getInfrastructureCosts,
  getMilestones,
  type InfrastructureCost,
  type Milestone,
} from "@/app/actions/operations";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Task } from "@/lib/schemas";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-white/10 text-white/50",
  in_progress: "bg-cyan-500/15 text-cyan-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  blocked: "bg-rose-500/15 text-rose-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};

const CATEGORY_LABELS: Record<string, string> = {
  hosting: "Hosting",
  database: "Database",
  ai_api: "AI APIs",
  dev_tools: "Dev tools",
  other: "Other",
};

export default function OperationsPage() {
  return (
    <OperationsGuard mode="operations">
      <OperationsHub />
    </OperationsGuard>
  );
}

function OperationsHub() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const departments = useWorkspaceStore((s) => s.departments);
  const syntaxureId = workspaces.find((w) =>
    w.name.startsWith("Syntaxure Labs"),
  )?.id;

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [costs, setCosts] = useState<InfrastructureCost[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [ms, cs] = await Promise.all([
          getMilestones(),
          getInfrastructureCosts(),
        ]);
        if (cancelled) return;
        setMilestones(ms);
        setCosts(cs);
        if (syntaxureId) {
          const res = await fetch(
            `/api/tasks?workspaceId=${encodeURIComponent(syntaxureId)}`,
          );
          if (res.ok && !cancelled) setTasks((await res.json()) as Task[]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [syntaxureId]);

  const stats = useMemo(() => {
    const active = milestones.filter(
      (m) => m.status === "pending" || m.status === "in_progress",
    ).length;
    const blocked = milestones.filter((m) => m.status === "blocked").length;
    const completedTasks = tasks.filter((t) => t.status === "approved").length;
    const completionRate =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const spend = costs.reduce((sum, c) => sum + c.actualSpend, 0);
    return { active, blocked, completionRate, spend };
  }, [milestones, costs, tasks]);

  const throughput = useMemo(() => {
    const now = Date.now();
    const day = 864e5;
    return {
      created7: tasks.filter((t) => now - new Date(t.createdAt).getTime() < 7 * day)
        .length,
      created30: tasks.filter(
        (t) => now - new Date(t.createdAt).getTime() < 30 * day,
      ).length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      backlog: tasks.filter((t) => t.status === "backlog").length,
    };
  }, [tasks]);

  const allocation = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (!t.departmentId) continue;
      counts.set(t.departmentId, (counts.get(t.departmentId) || 0) + 1);
    }
    const rows = departments
      .map((d) => ({ name: d.name, count: counts.get(d.id) || 0 }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
    return { rows, max: rows[0]?.count || 1 };
  }, [tasks, departments]);

  const upcoming = useMemo(
    () =>
      milestones
        .filter((m) => m.status !== "completed")
        .sort((a, b) =>
          (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"),
        )
        .slice(0, 5),
    [milestones],
  );

  const costByCategory = useMemo(() => {
    const map = new Map<string, { budget: number; spend: number }>();
    for (const c of costs) {
      const entry = map.get(c.category) || { budget: 0, spend: 0 };
      entry.budget += c.monthlyBudget;
      entry.spend += c.actualSpend;
      map.set(c.category, entry);
    }
    return [...map.entries()].sort((a, b) => b[1].spend - a[1].spend);
  }, [costs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations Hub</h1>
          <p className="mt-1 text-sm text-white/40">
            Milestones, throughput, resource allocation, and infrastructure
            spend — across the company.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/operations/milestones"
            className="flex items-center gap-2 rounded-lg border border-border bg-glass-04 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-border-active"
          >
            <Target className="h-3.5 w-3.5" />
            Manage Milestones
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href="/bmc"
            className="flex items-center gap-2 rounded-lg border border-border bg-glass-04 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-border-active"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Business Canvas
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Completion Rate"
          value={`${stats.completionRate}%`}
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Active Milestones"
          value={String(stats.active)}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Blocked Items"
          value={String(stats.blocked)}
          warn={stats.blocked > 0}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Monthly Spend"
          value={`₱${stats.spend.toLocaleString()}`}
        />
      </div>

      {/* Sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming milestones */}
        <section className="rounded-xl border border-border glass-subtle p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">
            Upcoming Milestones
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-xs text-white/30">
              No open milestones — add one in Manage Milestones.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-glass-04 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/80">{m.title}</p>
                    <p className="text-[10px] font-mono text-white/30">
                      {m.dueDate ? `Due ${m.dueDate}` : "No due date"}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[m.status]}`}
                  >
                    {STATUS_LABELS[m.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Task throughput */}
        <section className="rounded-xl border border-border glass-subtle p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">
            Task Throughput
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Created · 7 days" value={throughput.created7} />
            <Metric label="Created · 30 days" value={throughput.created30} />
            <Metric label="In Progress" value={throughput.inProgress} />
            <Metric label="Backlog" value={throughput.backlog} />
          </div>
        </section>

        {/* Resource allocation */}
        <section className="rounded-xl border border-border glass-subtle p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">
            Resource Allocation
          </h2>
          {allocation.rows.length === 0 ? (
            <p className="text-xs text-white/30">
              No department-assigned tasks yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {allocation.rows.map((row) => (
                <li key={row.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-white/60">{row.name}</span>
                    <span className="font-mono text-white/40">{row.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-cyan-500/60"
                      style={{ width: `${Math.round((row.count / allocation.max) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Infrastructure costs */}
        <section className="rounded-xl border border-border glass-subtle p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">
            Infrastructure Costs
          </h2>
          {costByCategory.length === 0 ? (
            <p className="text-xs text-white/30">
              No cost entries yet — track them in Manage Milestones&apos;
              sibling table via the API, or add via the Operations data model.
            </p>
          ) : (
            <ul className="space-y-2">
              {costByCategory.map(([category, entry]) => (
                <li
                  key={category}
                  className="flex items-center justify-between rounded-lg border border-border bg-glass-04 px-3 py-2 text-xs"
                >
                  <span className="text-white/60">
                    {CATEGORY_LABELS[category] || category}
                  </span>
                  <span className="font-mono text-white/40">
                    ₱{entry.spend.toLocaleString()} / ₱
                    {entry.budget.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border glass-subtle p-4">
      <div
        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${
          warn ? "bg-rose-500/10 text-rose-400" : "bg-cyan-500/10 text-cyan-400"
        }`}
      >
        {icon}
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-glass-04 px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
