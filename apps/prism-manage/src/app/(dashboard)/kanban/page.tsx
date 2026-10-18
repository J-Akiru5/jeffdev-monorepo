"use client";

/**
 * Kanban Page
 * -----------
 * Drag-and-drop kanban board for visual task management with Supabase persistence.
 * Optimized for drag performance: task cards are memoized so only the dragged card
 * re-renders on drag start/end.
 */

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useProjects } from "@/contexts/project-context";
import { ArrowRightLeft, GripVertical, Plus } from "lucide-react";
import { updateTaskStatus, createTask } from "@/app/actions/tasks";
import type { Task } from "@/lib/schemas";
import { getTaskTypeConfig, STAFF_LOCKED_STATUSES } from "@/lib/task-types";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { createClient } from "@/lib/supabase/browser";
import { isSyntaxureWorkspaceName } from "@/lib/workspace-names";
import { PromptDialog } from "@/components/prompt-dialog";
import { toast } from "sonner";

type KanbanColumn = "backlog" | "todo" | "in_progress" | "in_review" | "approved";

interface KanbanTask extends Task {
  column: KanbanColumn;
}

const columns: { id: KanbanColumn; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "#6b7280" },
  { id: "todo", title: "To Do", color: "#3b82f6" },
  { id: "in_progress", title: "In Progress", color: "#f59e0b" },
  { id: "in_review", title: "In Review", color: "#8b5cf6" },
  { id: "approved", title: "Approved", color: "#10b981" },
];

// ─── Memoized Task Card ────────────────────────────────────────

interface KanbanTaskCardProps {
  task: KanbanTask;
  projectMap: Record<string, { name: string; color: string }>;
  isDragged: boolean;
  isSyntaxureLabs: boolean;
  cpoUserId: string | null;
  onDragStart: (id: string) => void;
  onMove: (taskId: string, column: KanbanColumn) => void;
}

/**
 * Individual kanban card wrapped in React.memo.
 * Only re-renders when its own props change (e.g. isDragged flips for this card),
 * preventing the full column re-render during drag.
 */
const KanbanTaskCard = memo(function KanbanTaskCard({
  task,
  projectMap,
  isDragged,
  isSyntaxureLabs,
  cpoUserId,
  onDragStart,
  onMove,
}: KanbanTaskCardProps) {
  const typeConfig = getTaskTypeConfig(task.taskType);
  const project = projectMap[task.projectId];
  const [moveOpen, setMoveOpen] = useState(false);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      className={`relative cursor-grab rounded-lg border border-glass-05 bg-glass-04 p-3 transition-all hover:border-glass-10 active:cursor-grabbing ${
        isDragged ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-faint" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 text-xs">{typeConfig.icon}</span>
            <p className="text-sm text-white">{task.title}</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {project && (
              <>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-[11px] text-white/40">{project.name}</span>
              </>
            )}
            {task.priority === "high" && (
              <span className="text-[10px] text-red-400">High</span>
            )}
            {isSyntaxureLabs && (
              hasCpoReviewTag(task) || isAssignedToCpo(task, cpoUserId)
            ) && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                CPO Review
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Move menu — touch/keyboard friendly alternative to dragging */}
      <div className="absolute right-1.5 top-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMoveOpen((v) => !v);
          }}
          aria-label="Move task"
          className="rounded p-1 text-white/25 transition-colors hover:bg-white/5 hover:text-white/60"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
        </button>
        {moveOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMoveOpen(false)}
            />
            <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-white/[0.10] bg-[#0a0a0a] py-1 shadow-xl">
              {columns
                .filter((col) => col.id !== task.column)
                .map((col) => (
                  <button
                    key={col.id}
                    onClick={() => {
                      setMoveOpen(false);
                      onMove(task.id, col.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    {col.title}
                  </button>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

// ─── Page Component ────────────────────────────────────────────

export default function KanbanPage() {
  const { projects, activeProjectId } = useProjects();
  const userRole = useWorkspaceStore((s) => s.userRole);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const cpoUserId = useWorkspaceStore((s) => s.cpoUserId);
  // Find Syntaxure Labs workspace — only there does the RBAC apply
  const syntaxureWorkspaceId = workspaces.find((w) =>
    isSyntaxureWorkspaceName(w.name),
  )?.id;
  const isSyntaxureLabs = !!(syntaxureWorkspaceId && activeWorkspaceId === syntaxureWorkspaceId);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [quickAddColumn, setQuickAddColumn] = useState<KanbanColumn | null>(null);

  // Stable drag-start handler — setter is guaranteed stable by React
  const handleDragStart = useCallback((taskId: string) => {
    setDraggedTask(taskId);
  }, []);

  // Pre-compute project lookup map so KanbanTaskCard receives stable references
  const projectMap = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {};
    for (const p of projects) {
      map[p.id] = { name: p.name, color: p.color || "var(--color-cyan)" };
    }
    return map;
  }, [projects]);

  // Fetch tasks from Supabase for the active workspace
  const loadTasks = useCallback(async () => {
    if (!activeWorkspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/tasks?workspaceId=${encodeURIComponent(activeWorkspaceId)}`,
      );
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
            pathIndex: Number(t.pathIndex || t.path_index || 0),
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
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Live updates: refresh when tasks change in this workspace
  useEffect(() => {
    if (!activeWorkspaceId) return;
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(`kanban-tasks-${activeWorkspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `workspace_id=eq.${activeWorkspaceId}`,
        },
        () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => loadTasks(), 400);
        },
      )
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [activeWorkspaceId, loadTasks]);

  const filteredTasks = useMemo(
    () =>
      activeProjectId
        ? tasks.filter((t) => t.projectId === activeProjectId)
        : tasks,
    [tasks, activeProjectId],
  );

  // Group tasks by column — avoids 5× filter calls per render
  const tasksByColumn = useMemo(() => {
    const map: Record<string, KanbanTask[]> = {};
    for (const col of columns) {
      map[col.id] = [];
    }
    for (const task of filteredTasks) {
      map[task.column]!.push(task);
    }
    return map;
  }, [filteredTasks]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const moveTaskToColumn = useCallback(
    async (taskId: string, column: KanbanColumn) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Skip if moving into the same column
      if (task.column === column) return;

      // RBAC check: employees cannot move into Approved (only in Syntaxure Labs)
      if (
        isSyntaxureLabs &&
        userRole === "employee" &&
        STAFF_LOCKED_STATUSES.includes(column)
      ) {
        toast.error("Only founders and the CPO can approve tasks");
        return;
      }

      try {
        const dbStatus = column;
        await updateTaskStatus(taskId, dbStatus);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  column,
                  status: dbStatus as Task["status"],
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        );

        // Show contextual toast based on the target column
        if (column === "in_review") {
          toast.success("Sent to CPO for review");
        } else if (column === "approved") {
          toast.success("Task approved");
        } else if (column === "backlog") {
          toast.info("Moved to backlog");
        }
      } catch {
        toast.error("Failed to update task status");
      }
    },
    [tasks, isSyntaxureLabs, userRole],
  );

  const handleDrop = async (column: KanbanColumn) => {
    if (!draggedTask) return;
    await moveTaskToColumn(draggedTask, column);
    setDraggedTask(null);
  };

  const handleAddTask = useCallback((column: KanbanColumn) => {
    setQuickAddColumn(column);
  }, []);

  const submitQuickAdd = useCallback(
    async (title: string) => {
      const column = quickAddColumn;
      if (!column) return;

      const projectId = activeProjectId || projects[0]?.id;
      if (!projectId) {
        toast.error("Create a list first");
        return;
      }

      try {
        await createTask({ title, projectId, status: column });
        // Refetch so the board reflects the real row (id, timestamps, ordering)
        await loadTasks();
        toast.success("Task added");
      } catch {
        toast.error("Failed to create task");
      }
    },
    [quickAddColumn, activeProjectId, projects, loadTasks],
  );

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

      {/* Kanban Columns — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:hidden">
        {columns.map((column) => {
          const columnTasks = tasksByColumn[column.id]!;
          return (
            <div
              key={column.id}
              className="min-w-[80vw] max-w-[80vw] flex-shrink-0 snap-center rounded-xl border border-border glass-subtle p-4"
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
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <KanbanTaskCard
                    key={task.id}
                    task={task}
                    projectMap={projectMap}
                    isDragged={draggedTask === task.id}
                    isSyntaxureLabs={isSyntaxureLabs}
                    cpoUserId={cpoUserId}
                    onDragStart={handleDragStart}
                    onMove={moveTaskToColumn}
                  />
                ))}

                {/* Add Task Button */}
                <button
                  onClick={() => handleAddTask(column.id)}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-white/30 transition-colors hover:border-border-active hover:text-white/50"
                >
                  <Plus className="h-4 w-4" />
                  Add task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {columns.map((column) => {
          const columnTasks = tasksByColumn[column.id]!;
          return (
            <div
              key={column.id}
              className="min-h-[400px] rounded-xl border border-border glass-subtle p-4"
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
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <KanbanTaskCard
                    key={task.id}
                    task={task}
                    projectMap={projectMap}
                    isDragged={draggedTask === task.id}
                    isSyntaxureLabs={isSyntaxureLabs}
                    cpoUserId={cpoUserId}
                    onDragStart={handleDragStart}
                    onMove={moveTaskToColumn}
                  />
                ))}

                {/* Add Task Button */}
                <button
                  onClick={() => handleAddTask(column.id)}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-white/30 transition-colors hover:border-border-active hover:text-white/50"
                >
                  <Plus className="h-4 w-4" />
                  Add task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <PromptDialog
        open={quickAddColumn !== null}
        onClose={() => setQuickAddColumn(null)}
        onSubmit={submitQuickAdd}
        title="Add task"
        placeholder="Task title…"
        confirmLabel="Add task"
      />
    </div>
  );
}

function mapStatusToColumn(status: string): KanbanColumn {
  switch (status) {
    case "todo":
      return "todo";
    case "in_progress":
      return "in_progress";
    case "in_review":
      return "in_review";
    case "approved":
      return "approved";
    default:
      return "backlog";
  }
}

function hasCpoReviewTag(task: KanbanTask): boolean {
  return Array.isArray(task.tags) && task.tags.includes("CPO Review");
}

function isAssignedToCpo(task: KanbanTask, cpoUserId: string | null): boolean {
  return !!cpoUserId && !!task.assignedTo && task.assignedTo === cpoUserId;
}
