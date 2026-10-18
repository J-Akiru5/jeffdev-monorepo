"use client";

import type { Task, Project } from "@/lib/schemas";

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  approved: "Approved",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "#6b7280",
  todo: "#3b82f6",
  in_progress: "#f59e0b",
  in_review: "#8b5cf6",
  approved: "#10b981",
};

const PRIORITY_CLASSES: Record<string, string> = {
  low: "text-white/40",
  medium: "text-amber-400",
  high: "text-red-400",
};

interface TaskTableProps {
  tasks: Task[];
  projects: Project[];
  members: { userId: string; name: string }[];
  onTaskClick: (id: string) => void;
}

/**
 * Compact table view of tasks — an alternative to the project-grouped list.
 */
export function TaskTable({ tasks, projects, members, onTaskClick }: TaskTableProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const memberMap = new Map(members.map((m) => [m.userId, m.name]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-white/30">
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3 font-medium">List</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr className="border-t border-border/60">
              <td colSpan={6} className="px-4 py-12 text-center text-white/40">
                No tasks match the current filters.
              </td>
            </tr>
          )}
          {tasks.map((task) => {
            const due = task.dueDate ? new Date(task.dueDate) : null;
            const isOverdue =
              !!due && due.getTime() < today.getTime() && task.status !== "approved";
            return (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task.id)}
                className="cursor-pointer border-t border-border/60 transition-colors hover:bg-white/[0.03]"
              >
                <td className="max-w-[320px] truncate px-4 py-2.5">
                  <span className={task.status === "approved" ? "text-white/40 line-through" : "text-white/80"}>
                    {task.title}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[task.status] || "#6b7280" }}
                    />
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </td>
                <td className={`px-4 py-2.5 text-xs capitalize ${PRIORITY_CLASSES[task.priority] || "text-white/40"}`}>
                  {task.priority}
                </td>
                <td className="px-4 py-2.5 text-xs text-white/50">
                  {task.assignedTo ? memberMap.get(task.assignedTo) || "Member" : "—"}
                </td>
                <td className={`px-4 py-2.5 text-xs ${isOverdue ? "text-red-400" : "text-white/50"}`}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2.5 text-xs text-white/40">
                  {projectMap.get(task.projectId)?.name || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
