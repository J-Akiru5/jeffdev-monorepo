import { createClient as createServer } from "@/lib/supabase/server";
import Link from "next/link";
import {
  CheckSquare,
  FileText,
  Clock,
  AlertTriangle,
  TrendingUp,
  Layers,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createServer();

  const { data: tasks } = await supabase
    .from("pm_tasks")
    .select("id, status, priority, deadline")
    .order("created_at", { ascending: false });

  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((t) => t.status === "completed").length ?? 0;
  const overdueTasks =
    tasks?.filter(
      (t) =>
        t.deadline &&
        new Date(t.deadline) < new Date() &&
        t.status !== "completed"
    ).length ?? 0;
  const inProgressTasks =
    tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      label: "Total Tasks",
      value: totalTasks,
      icon: CheckSquare,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "In Progress",
      value: inProgressTasks,
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Overdue",
      value: overdueTasks,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Completed",
      value: completedTasks,
      icon: CheckSquare,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          System overview and project management
        </p>
      </div>

      {/* Overall Progress */}
      <div className="glass p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300">
            Overall Progress
          </h2>
          <span className="text-2xl font-bold text-white">{progress}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="progress-bar h-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {completedTasks} of {totalTasks} tasks completed
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">{stat.label}</p>
              <div className={`${stat.bg} rounded-lg p-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/tasks"
          className="glass glass-hover group p-6 transition-all"
        >
          <CheckSquare className="mb-3 h-8 w-8 text-violet-400 transition-transform group-hover:scale-110" />
          <h3 className="font-medium text-white">Task Management</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Track checklists, deadlines, and milestones
          </p>
        </Link>

        <Link
          href="/docs/architecture"
          className="glass glass-hover group p-6 transition-all"
        >
          <Layers className="mb-3 h-8 w-8 text-blue-400 transition-transform group-hover:scale-110" />
          <h3 className="font-medium text-white">Architecture Docs</h3>
          <p className="mt-1 text-sm text-zinc-400">
            System architecture, data flows, and decisions
          </p>
        </Link>

        <Link
          href="/docs/apps"
          className="glass glass-hover group p-6 transition-all"
        >
          <FileText className="mb-3 h-8 w-8 text-green-400 transition-transform group-hover:scale-110" />
          <h3 className="font-medium text-white">App Documentation</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Per-app docs, APIs, and database schemas
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="glass p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-300">
          Upcoming Deadlines
        </h2>
        {tasks && tasks.filter((t) => t.deadline && t.status !== "completed").length > 0 ? (
          <div className="space-y-2">
            {tasks
              .filter((t) => t.deadline && t.status !== "completed")
              .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
              .slice(0, 5)
              .map((task) => {
                const isOverdue = new Date(task.deadline!) < new Date();
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Clock
                        className={`h-4 w-4 ${isOverdue ? "text-red-400" : "text-zinc-500"}`}
                      />
                      <span className="text-sm text-zinc-300">Task #{task.id.slice(0, 8)}</span>
                    </div>
                    <span
                      className={`text-xs ${isOverdue ? "text-red-400" : "text-zinc-500"}`}
                    >
                      {new Date(task.deadline!).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No upcoming deadlines</p>
        )}
      </div>
    </div>
  );
}
