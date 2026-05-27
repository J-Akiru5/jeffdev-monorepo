"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { getMarketingTasks } from "@/app/actions/marketing";
import { TaskCard } from "@/components/marketing/task-card";
import { TaskForm } from "@/components/marketing/task-form";
import type { MarketingTask, MarketingTeamMember } from "@/lib/schemas";

const statusConfig: Record<string, { label: string; dotColor: string }> = {
  todo: { label: "To Do", dotColor: "bg-glass-30" },
  "in-progress": { label: "In Progress", dotColor: "bg-cyan-400" },
  done: { label: "Done", dotColor: "bg-emerald-400" },
};

const PHASES = [
  { value: "phase-1", label: "Phase 1 — Foundation" },
  { value: "phase-2", label: "Phase 2 — Authority" },
  { value: "phase-3", label: "Phase 3 — Launch" },
  { value: "ongoing", label: "Ongoing" },
];

const COLUMNS: ("todo" | "in-progress" | "done")[] = [
  "todo",
  "in-progress",
  "done",
];

function columnTitleColor(status: string): string {
  if (status === "todo") return "text-white/50";
  if (status === "in-progress") return "text-cyan-400";
  return "text-emerald-400";
}

type Filter = { phase?: string; owner?: string };

export function TaskBoard({
  tasks: initialTasks,
  team,
}: {
  tasks: MarketingTask[];
  team: MarketingTeamMember[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<Filter>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await getMarketingTasks();
      setTasks(fresh);
    } catch {
      // Tasks remain at previous state on failure
    }
    setRefreshing(false);
  }, []);

  const filtered = useMemo(() => {
    let result = [...tasks];
    if (filter.phase) {
      result = result.filter((t) => t.phaseId === filter.phase);
    }
    if (filter.owner) {
      result = result.filter((t) => t.ownerIds.includes(filter.owner!));
    }
    return result;
  }, [tasks, filter]);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/marketing"
              className="inline-flex items-center gap-1 text-xs text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Dashboard
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-white">Marketing Tasks</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="glass inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <TaskForm team={team} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <select
              value={filter.phase || ""}
              onChange={(e) =>
                setFilter({ ...filter, phase: e.target.value || undefined })
              }
              className="bg-glass-05 border border-white/10 rounded px-3 py-1.5 text-xs text-white/70"
            >
              <option value="" className="bg-black">
                All Phases
              </option>
              {PHASES.map((p) => (
                <option key={p.value} value={p.value} className="bg-black">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={filter.owner || ""}
              onChange={(e) =>
                setFilter({ ...filter, owner: e.target.value || undefined })
              }
              className="bg-glass-05 border border-white/10 rounded px-3 py-1.5 text-xs text-white/70"
            >
              <option value="" className="bg-black">
                All Owners
              </option>
              {team.map((m) => (
                <option key={m.id} value={m.id} className="bg-black">
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {(filter.phase || filter.owner) && (
            <button
              onClick={() => setFilter({})}
              className="text-xs text-rose-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}

          <span className="text-xs text-white/30 ml-auto">
            {filtered.length} task{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((status) => {
          const columnTasks = filtered.filter((t) => t.status === status);
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`h-2 w-2 rounded-full ${statusConfig[status]!.dotColor}`}
                />
                <h2
                  className={`text-sm font-mono uppercase tracking-wider ${columnTitleColor(status)}`}
                >
                  {statusConfig[status]!.label}
                </h2>
                <span className="text-xs text-white/30 ml-auto">
                  {columnTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="glass rounded-lg p-6 text-center">
                    <p className="text-sm text-white/30 italic">No tasks</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} team={team} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
