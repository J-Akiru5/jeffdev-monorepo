"use client";

/**
 * Tasks Page
 * ----------
 * Main task list view showing all tasks organized by project.
 * Uses Next.js Intercepting Routes for task creation/editing via slide-over.
 */

import { useState, useEffect, Suspense, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TaskList } from "@/components/task-list";
import { useProjects } from "@/contexts/project-context";
import { Star, Plus } from "lucide-react";
import {
  createTask,
  deleteTask,
  toggleTaskComplete,
  toggleTaskStar,
} from "@/app/actions/tasks";
import type { Task } from "@/lib/schemas";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

async function fetchTasks(workspaceId: string): Promise<Task[]> {
  const res = await fetch(
    `/api/tasks?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []) as Task[];
}

function TasksContent() {
  const router = useRouter();
  const { projects, activeProjectId } = useProjects();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const departmentId = searchParams.get("department");
  const isStarredFilter = filter === "starred";
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Keep a ref to the latest tasks so callbacks can read current state
  // without depending on tasks (which would invalidate memo guards on every toggle).
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const loadTasks = useCallback(async () => {
    const wsId = activeWorkspaceId;
    if (!wsId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchTasks(wsId);
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Live updates: refresh when tasks change in this workspace
  useEffect(() => {
    const wsId = activeWorkspaceId;
    if (!wsId) return;
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(`tasks-${wsId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `workspace_id=eq.${wsId}`,
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

  // Filter tasks by active project, starred filter, and department (memoized)
  const filteredTasks = useMemo(() => {
    let list = activeProjectId
      ? tasks.filter((t) => t.projectId === activeProjectId)
      : tasks;
    if (isStarredFilter) list = list.filter((t) => t.isStarred);
    if (departmentId) list = list.filter((t) => t.departmentId === departmentId);
    return list;
  }, [tasks, activeProjectId, isStarredFilter, departmentId]);

  // Group tasks by project (memoized)
  const tasksByProject = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const project of projects) {
      const projectTasks = filteredTasks.filter(
        (t) => t.projectId === project.id,
      );
      if (projectTasks.length > 0 || activeProjectId === project.id) {
        map[project.id] = projectTasks;
      }
    }
    return map;
  }, [filteredTasks, projects, activeProjectId]);

  // ── Navigation Handlers (Intercepting Routes) ──

  const handleCreateTask = useCallback(() => {
    router.push("/tasks/new");
  }, [router]);

  const handleTaskClick = useCallback(
    (taskId: string) => {
      router.push(`/tasks/${taskId}/edit`);
    },
    [router],
  );

  // ── Task Action Handlers ──

  const handleToggleComplete = useCallback(
    async (taskId: string) => {
      try {
        const task = tasksRef.current.find((t) => t.id === taskId);
        if (!task) return;
        const completed = task.status !== "approved";
        await toggleTaskComplete(taskId, completed);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: completed ? "approved" as const : "backlog" as const,
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        );
      } catch {
        toast.error("Failed to update task");
      }
    },
    [],
  );

  const handleToggleStar = useCallback(
    async (taskId: string) => {
      try {
        const task = tasksRef.current.find((t) => t.id === taskId);
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
    [],
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

  const handleAdd = useCallback(
    async (title: string, projectId: string) => {
      if (!activeWorkspaceId) return;
      try {
        await createTask({
          title,
          projectId,
          workspaceId: activeWorkspaceId,
        });
        const data = await fetchTasks(activeWorkspaceId);
        setTasks(data);
        toast.success("Task created");
      } catch {
        toast.error("Failed to create task");
      }
    },
    [activeWorkspaceId],
  );

  const handleExpand = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_title: string, _projectId: string) => {
      router.push("/tasks/new");
    },
    [router],
  );

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
      <div className="mb-6 flex items-center justify-between">
        <div>
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
            {filteredTasks.filter((t) => t.status !== "approved").length} tasks
            remaining
            {departmentId ? " · filtered by department" : ""}
          </p>
        </div>

        <button
          onClick={handleCreateTask}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
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
