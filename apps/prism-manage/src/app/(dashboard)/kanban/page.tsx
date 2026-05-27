"use client";

/**
 * Kanban Page
 * -----------
 * Drag-and-drop kanban board for visual task management with Supabase persistence.
 */

import { useState, useEffect } from "react";
import { useProjects } from "@/contexts/project-context";
import { GripVertical, Plus } from "lucide-react";
import { updateTaskStatus, createTask } from "@/app/actions/tasks";
import type { Task } from "@/lib/schemas";
import { getTaskTypeConfig } from "@/lib/task-types";
import { toast } from "sonner";

type KanbanColumn = "backlog" | "in_progress" | "review" | "done";

interface KanbanTask extends Task {
  column: KanbanColumn;
}

const columns: { id: KanbanColumn; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "#6b7280" },
  { id: "in_progress", title: "In Progress", color: "#3b82f6" },
  { id: "review", title: "In Review", color: "var(--color-purple)" },
  { id: "done", title: "Done", color: "var(--color-emerald)" },
];

export default function KanbanPage() {
  const { projects, activeProjectId } = useProjects();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Fetch tasks from Supabase
  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch("/api/tasks");
        const data = await res.json();
        // API returns camelCase Task[] — map to KanbanTask
        const mapped: KanbanTask[] = (data || []).map(
          (t: Record<string, unknown>) => ({
            id: (t.id as string)?.toString() || String(Math.random()),
            projectId:
              (t.projectId as string) || (t.project_id as string) || "",
            title: String(t.title || ""),
            taskType: (t.taskType as Task["taskType"]) || (t.task_type as Task["taskType"]) || "feature",
            status: (t.status as Task["status"]) || "todo",
            priority: (t.priority as Task["priority"]) || "medium",
            isStarred:
              t.isStarred === true || t.is_starred === true || t.is_starred === "true" || false,
            order: Number(t.order || 0),
            description: t.description
              ? String(t.description)
              : t.notes
                ? String(t.notes)
                : undefined,
            assignedTo: t.assignedTo ? String(t.assignedTo) : t.assigned_to ? String(t.assigned_to) : undefined,
            tags: Array.isArray(t.tags) ? (t.tags as string[]) : undefined,
            dueDate: t.dueDate ? String(t.dueDate) : t.due_date ? String(t.due_date) : undefined,
            createdAt:
              String(t.createdAt || t.created_at || new Date().toISOString()),
            updatedAt:
              String(t.updatedAt || t.updated_at || new Date().toISOString()),
            column: mapStatusToColumn(String(t.status ?? "todo")),
          }),
        );
        setTasks(mapped);
      } catch {
        console.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const filteredTasks = activeProjectId
    ? tasks.filter((t) => t.projectId === activeProjectId)
    : tasks;

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (column: KanbanColumn) => {
    if (!draggedTask) return;

    const task = tasks.find((t) => t.id === draggedTask);
    if (!task) return;

    try {
      const dbStatus =
        column === "done" ? "done" : column === "in_progress" ? "in_progress" : column === "review" ? "review" : "todo";
      await updateTaskStatus(draggedTask, dbStatus);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTask
            ? {
                ...t,
                column,
                status: dbStatus as Task["status"],
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      );
    } catch {
      toast.error("Failed to update task status");
    }
    setDraggedTask(null);
  };

  const handleAddTask = async (column: KanbanColumn) => {
    const title = prompt("Task title:");
    if (!title) return;

    const projectId = activeProjectId || projects[0]?.id || "1";
    try {
      await createTask({ title, projectId: projectId.toString() });
      const newTask: KanbanTask = {
        id: Date.now().toString(),
        projectId: projectId.toString(),
        title,
        taskType: "feature",
        status: "todo",
        priority: "medium",
        isStarred: false,
        order: tasks.filter((t) => t.projectId === projectId).length,
        column,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      toast.success("Task added");
    } catch {
      toast.error("Failed to create task");
    }
  };

  const getTasksByColumn = (columnId: KanbanColumn) => {
    return filteredTasks.filter((t) => t.column === columnId);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
        <p className="mt-1 text-sm text-white/40">
          Drag and drop tasks between columns
        </p>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="min-h-[400px] rounded-xl border border-white/10 glass-subtle p-4"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Column Header */}
            <div className="mb-4 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <h2 className="text-sm font-semibold text-white">
                {column.title}
              </h2>
              <span className="ml-auto font-mono text-xs text-white/30">
                {getTasksByColumn(column.id).length}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {getTasksByColumn(column.id).map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const typeConfig = getTaskTypeConfig(task.taskType);

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className={`cursor-grab rounded-lg border border-white/5 bg-glass-04 p-3 transition-all hover:border-white/10 active:cursor-grabbing ${
                      draggedTask === task.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/20" />
                      <div className="min-w-0 flex-1">
                        {/* Type icon + Title */}
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 text-xs">
                            {typeConfig.icon}
                          </span>
                          <p className="text-sm text-white">{task.title}</p>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          {project && (
                            <>
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor: project.color || "var(--color-cyan)",
                                }}
                              />
                              <span className="text-[11px] text-white/40">
                                {project.name}
                              </span>
                            </>
                          )}
                          {/* Priority indicator */}
                          {task.priority === "high" && (
                            <span className="text-[10px] text-red-400">
                              High
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Task Button */}
              <button
                onClick={() => handleAddTask(column.id)}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 p-3 text-sm text-white/30 transition-colors hover:border-white/20 hover:text-white/50"
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function mapStatusToColumn(status: string): KanbanColumn {
  switch (status) {
    case "in_progress":
      return "in_progress";
    case "review":
      return "review";
    case "done":
      return "done";
    default:
      return "backlog";
  }
}
