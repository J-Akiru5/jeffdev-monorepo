"use client";

/**
 * Tasks Page
 * ----------
 * Main task list view showing all tasks organized by project.
 * Uses Supabase server actions for data persistence.
 */

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { TaskList } from "@/components/task-list";
import { useProjects } from "@/contexts/project-context";
import { Star } from "lucide-react";
import {
  createTask,
  deleteTask,
  toggleTaskComplete,
  toggleTaskStar,
} from "@/app/actions/tasks";
import type { Task } from "@/lib/schemas";
import { toast } from "sonner";

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) return [];
  const data = await res.json();
  // Map snake_case from Supabase to camelCase Task type
  return (data || []).map(mapTask);
}

/** Map a raw Supabase row (snake_case) to the Task type (camelCase). */
function mapTask(raw: Record<string, unknown>): Task {
  return {
    id: String(raw.id || ""),
    projectId: String(raw.project_id || raw.projectId || ""),
    title: String(raw.title || ""),
    notes: String(raw.notes || raw.description || ""),
    completed: raw.status === "done",
    starred: raw.priority ? Number(raw.priority) > 0 : false,
    dueDate: raw.due_date ? String(raw.due_date) : undefined,
    dueTime: raw.due_time ? String(raw.due_time) : undefined,
    order: Number(raw.order || 0),
    createdAt: String(
      raw.created_at || raw.createdAt || new Date().toISOString(),
    ),
    updatedAt: String(
      raw.updated_at || raw.updatedAt || new Date().toISOString(),
    ),
  };
}

function TasksContent() {
  const { projects, activeProjectId } = useProjects();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const isStarredFilter = filter === "starred";

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
    filteredTasks = filteredTasks.filter((t) => t.starred);
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

  const handleToggleComplete = useCallback(
    async (taskId: string) => {
      try {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        await toggleTaskComplete(taskId, !task.completed);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  completed: !t.completed,
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
        await toggleTaskStar(taskId, !task.starred);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  starred: !t.starred,
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
      // Refetch to get server-assigned ID
      const data = await fetchTasks();
      setTasks(data);
      toast.success("Task created");
    } catch {
      toast.error("Failed to create task");
    }
  }, []);

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
          {filteredTasks.filter((t) => !t.completed).length} tasks remaining
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
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-white/40">Loading tasks...</div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
