"use client";

/**
 * Tasks Page
 * ----------
 * Main task list view showing all tasks organized by project.
 * Integrates the TaskSheet slide-over for full task creation/editing.
 */

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { TaskList } from "@/components/task-list";
import { TaskSheet } from "@/components/task-sheet";
import type { TaskSheetData } from "@/components/task-sheet";
import { useProjects } from "@/contexts/project-context";
import { Star } from "lucide-react";
import {
  createTask,
  deleteTask,
  toggleTaskComplete,
  toggleTaskStar,
  updateTask,
} from "@/app/actions/tasks";
import type { Task } from "@/lib/schemas";
import { toast } from "sonner";

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) return [];
  const data = await res.json();
  // API already returns camelCase Task[] from getTasks() server action
  return (data || []) as Task[];
}

function TasksContent() {
  const { projects, activeProjectId } = useProjects();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const isStarredFilter = filter === "starred";

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Load tasks from Supabase
  useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      try {
        const data = await fetchTasks();
        if (!cancelled) setTasks(data);
      } catch (err) {
        console.error("Failed to load tasks:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadTasks();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter tasks by active project and/or starred filter
  let filteredTasks = activeProjectId
    ? tasks.filter((t) => t.projectId === activeProjectId)
    : tasks;

  if (isStarredFilter) {
    filteredTasks = filteredTasks.filter((t) => t.isStarred);
  }

  // Group tasks by project
  const tasksByProject = projects.reduce(
    (acc, project) => {
      const projectTasks = filteredTasks.filter(
        (t) => t.projectId === project.id,
      );
      if (projectTasks.length > 0 || activeProjectId === project.id) {
        acc[project.id] = projectTasks;
      }
      return acc;
    },
    {} as Record<string, Task[]>,
  );

  // ── Sheet Handlers ──

  const handleTaskClick = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setEditTask(task);
        setSheetOpen(true);
      }
    },
    [tasks],
  );

  const handleSheetSubmit = useCallback(
    async (data: TaskSheetData) => {
      try {
        if (editTask) {
          // Update existing task
          await updateTask(editTask.id, data as unknown as Record<string, unknown>);
          const fresh = await fetchTasks();
          setTasks(fresh);
          toast.success("Task updated");
        } else {
          // Create new task
          await createTask({
            title: data.title,
            projectId: data.projectId,
            taskType: data.taskType,
            status: data.status,
            priority: data.priority,
            description: data.description || undefined,
            notes: data.notes || undefined,
            assignedTo: data.assignedTo || undefined,
            tags: data.tags.length > 0 ? data.tags : undefined,
            dueDate: data.dueDate || undefined,
            dueTime: data.dueTime || undefined,
          });
          const fresh = await fetchTasks();
          setTasks(fresh);
          toast.success("Task created");
        }
        setSheetOpen(false);
        setEditTask(null);
      } catch {
        toast.error(editTask ? "Failed to update task" : "Failed to create task");
      }
    },
    [editTask],
  );

  // ── Task Action Handlers ──

  const handleToggleComplete = useCallback(
    async (taskId: string) => {
      try {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        const completed = task.status !== "done";
        await toggleTaskComplete(taskId, completed);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: completed ? ("done" as const) : ("todo" as const),
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        );
      } catch {
        toast.error("Failed to update task");
      }
    },
    [tasks],
  );

  const handleToggleStar = useCallback(
    async (taskId: string) => {
      try {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        await toggleTaskStar(taskId, !task.isStarred);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  isStarred: !t.isStarred,
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        );
      } catch {
        toast.error("Failed to update task");
      }
    },
    [tasks],
  );

  const handleDelete = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  }, []);

  const handleAdd = useCallback(async (title: string, projectId: string) => {
    try {
      await createTask({ title, projectId: projectId.toString() });
      const data = await fetchTasks();
      setTasks(data);
      toast.success("Task created");
    } catch {
      toast.error("Failed to create task");
    }
  }, []);

  const handleExpand = useCallback(
    (title: string, projectId: string) => {
      setEditTask(null);
      setSheetOpen(true);
      // Use sessionStorage to pass prefill data
      window.sessionStorage.setItem(
        "task-sheet-prefill",
        JSON.stringify({
          title,
          projectId: projectId || projects[0]?.id || "",
        }),
      );
    },
    [projects],
  );

  // Build initial data for the sheet
  const sheetInitialData = (() => {
    if (editTask) {
      return {
        title: editTask.title,
        taskType: editTask.taskType as TaskSheetData["taskType"],
        description: editTask.description || "",
        notes: editTask.notes || "",
        status: editTask.status,
        priority: editTask.priority,
        assignedTo: editTask.assignedTo || "",
        tags: editTask.tags || [],
        dueDate: editTask.dueDate || "",
        dueTime: editTask.dueTime || "",
        projectId: editTask.projectId,
      };
    }

    // Check sessionStorage for prefill data
    try {
      const stored = window.sessionStorage.getItem("task-sheet-prefill");
      if (stored) {
        window.sessionStorage.removeItem("task-sheet-prefill");
        const parsed = JSON.parse(stored);
        return {
          title: parsed.title || "",
          projectId: parsed.projectId || projects[0]?.id || "",
        };
      }
    } catch {
      // Ignore parse errors
    }
    return undefined;
  })();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          {isStarredFilter ? (
            <>
              <Star className="h-6 w-6 text-yellow-400" fill="currentColor" />
              Starred
            </>
          ) : activeProjectId ? (
            projects.find((p) => p.id === activeProjectId)?.name || "Tasks"
          ) : (
            "All Tasks"
          )}
        </h1>
        <p className="mt-1 text-sm text-white/40">
          {filteredTasks.filter((t) => t.status !== "done").length} tasks
          remaining
        </p>
      </div>

      {/* Task Lists by Project */}
      <div className="space-y-8">
        {Object.entries(tasksByProject).map(([projectId, projectTasks]) => {
          const project = projects.find((p) => p.id === projectId);
          if (!project) return null;

          return (
            <TaskList
              key={projectId}
              tasks={projectTasks}
              project={project}
              onToggleComplete={handleToggleComplete}
              onToggleStar={handleToggleStar}
              onDelete={handleDelete}
              onAdd={handleAdd}
              onExpand={handleExpand}
              onTaskClick={handleTaskClick}
            />
          );
        })}

        {Object.keys(tasksByProject).length === 0 && (
          <div className="py-12 text-center">
            <p className="text-white/40">
              No tasks yet. Create a task to get started.
            </p>
          </div>
        )}
      </div>

      {/* Task Sheet */}
      <TaskSheet
        isOpen={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditTask(null);
        }}
        onSubmit={handleSheetSubmit}
        initialData={sheetInitialData}
        projects={projects}
        mode={editTask ? "edit" : "create"}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-white/40">
          Loading tasks...
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
