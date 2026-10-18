"use client";

/**
 * Tasks Page
 * ----------
 * Main task view: search, filters, saved views, list (grouped by project)
 * and table views. Uses Next.js Intercepting Routes for task creation/editing.
 */

import { useState, useEffect, Suspense, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TaskList } from "@/components/task-list";
import { TaskTable } from "@/components/task-table";
import { useProjects } from "@/contexts/project-context";
import { Star, Plus, Search, List as ListIcon, Table2, X, Trash2 } from "lucide-react";
import {
  createTask,
  deleteTask,
  toggleTaskComplete,
  toggleTaskStar,
} from "@/app/actions/tasks";
import { getWorkspaceMembers } from "@/app/actions/workspace";
import {
  createSavedView,
  deleteSavedView,
  getSavedViews,
  type SavedView,
} from "@/app/actions/views";
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

const selectClass =
  "h-9 appearance-none rounded-lg border border-border bg-glass-04 px-3 text-xs text-white/70 outline-none transition-colors hover:border-border-active focus:border-cyan-500/50";

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

  // ── Toolbar state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [members, setMembers] = useState<{ userId: string; name: string; email: string }[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");

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

  // Load members (for the assignee filter + table view)
  useEffect(() => {
    const wsId = activeWorkspaceId;
    if (!wsId) return;
    let cancelled = false;
    getWorkspaceMembers(wsId).then((result) => {
      if (!cancelled) setMembers(result.members);
    });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId]);

  // Load saved views
  useEffect(() => {
    const wsId = activeWorkspaceId;
    if (!wsId) return;
    let cancelled = false;
    getSavedViews(wsId).then((views) => {
      if (!cancelled) setSavedViews(views);
    });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId]);

  // ── Filtering ──

  const hasActiveFilters = !!(
    searchQuery.trim() ||
    statusFilter ||
    priorityFilter ||
    assigneeFilter ||
    dueFilter
  );

  const filteredTasks = useMemo(() => {
    let list = activeProjectId
      ? tasks.filter((t) => t.projectId === activeProjectId)
      : tasks;
    if (isStarredFilter) list = list.filter((t) => t.isStarred);
    if (departmentId) list = list.filter((t) => t.departmentId === departmentId);
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter) list = list.filter((t) => t.priority === priorityFilter);
    if (assigneeFilter) list = list.filter((t) => t.assignedTo === assigneeFilter);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.notes || "").toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    if (dueFilter) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const endOfWeek = startOfToday + 7 * 24 * 60 * 60 * 1000;
      list = list.filter((t) => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate).getTime();
        if (dueFilter === "overdue") return due < startOfToday && t.status !== "approved";
        if (dueFilter === "today") return due >= startOfToday && due < startOfToday + 24 * 60 * 60 * 1000;
        if (dueFilter === "week") return due >= startOfToday && due < endOfWeek;
        return true;
      });
    }

    return list;
  }, [
    tasks,
    activeProjectId,
    isStarredFilter,
    departmentId,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    dueFilter,
    searchQuery,
  ]);

  // Group tasks by project (list view)
  // In the unfiltered view every list renders its group — even empty ones —
  // so the inline "Add a task" input is always available. With filters or a
  // selected list, only lists that have matches are shown.
  const tasksByProject = useMemo(() => {
    const map: Record<string, Task[]> = {};
    const showAllLists =
      !activeProjectId && !hasActiveFilters && !isStarredFilter && !departmentId;
    for (const project of projects) {
      const projectTasks = filteredTasks.filter(
        (t) => t.projectId === project.id,
      );
      if (
        projectTasks.length > 0 ||
        activeProjectId === project.id ||
        showAllLists
      ) {
        map[project.id] = projectTasks;
      }
    }
    return map;
  }, [
    filteredTasks,
    projects,
    activeProjectId,
    hasActiveFilters,
    isStarredFilter,
    departmentId,
  ]);

  // Sorted flat list (table view)
  const tableTasks = useMemo(
    () =>
      [...filteredTasks].sort((a, b) =>
        (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"),
      ),
    [filteredTasks],
  );

  // ── Saved views ──

  const currentViewConfig = useCallback(
    () => ({
      q: searchQuery,
      status: statusFilter,
      priority: priorityFilter,
      assignee: assigneeFilter,
      due: dueFilter,
    }),
    [searchQuery, statusFilter, priorityFilter, assigneeFilter, dueFilter],
  );

  const applySavedView = useCallback((view: SavedView) => {
    const config = view.config || {};
    setSearchQuery(typeof config.q === "string" ? config.q : "");
    setStatusFilter(typeof config.status === "string" ? config.status : "");
    setPriorityFilter(typeof config.priority === "string" ? config.priority : "");
    setAssigneeFilter(typeof config.assignee === "string" ? config.assignee : "");
    setDueFilter(typeof config.due === "string" ? config.due : "");
    setViewsOpen(false);
  }, []);

  const handleSaveView = useCallback(async () => {
    const name = newViewName.trim();
    if (!name || !activeWorkspaceId) return;
    const result = await createSavedView({
      workspaceId: activeWorkspaceId,
      name,
      config: currentViewConfig(),
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.view) setSavedViews((prev) => [...prev, result.view!]);
    setNewViewName("");
    toast.success(`View "${name}" saved`);
  }, [newViewName, activeWorkspaceId, currentViewConfig]);

  const handleDeleteView = useCallback(async (id: string) => {
    const result = await deleteSavedView(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("");
    setPriorityFilter("");
    setAssigneeFilter("");
    setDueFilter("");
  }, []);

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
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Page Header */}
      <div className="mb-4 flex items-center justify-between">
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
            {hasActiveFilters ? " · filters active" : ""}
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

      {/* Toolbar: search, filters, views, view toggle */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks…"
            className="h-9 w-full rounded-lg border border-border bg-glass-04 pl-9 pr-3 text-sm text-white/70 outline-none transition-colors placeholder:text-text-faint hover:border-border-active focus:border-cyan-500/50"
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">Status</option>
          <option value="backlog">Backlog</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
        </select>

        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={selectClass}>
          <option value="">Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className={selectClass}>
          <option value="">Assignee</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name || m.email}
            </option>
          ))}
        </select>

        <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)} className={selectClass}>
          <option value="">Due</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="week">Next 7 days</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs text-white/40 transition-colors hover:border-border-active hover:text-white/70"
            title="Clear filters"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}

        {/* Saved views */}
        <div className="relative">
          <button
            onClick={() => setViewsOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-glass-04 px-3 text-xs text-white/60 transition-colors hover:border-border-active hover:text-white/80"
          >
            Views
            {savedViews.length > 0 && (
              <span className="rounded-full bg-white/10 px-1.5 text-[10px] text-white/50">
                {savedViews.length}
              </span>
            )}
          </button>
          {viewsOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setViewsOpen(false)} />
              <div className="absolute right-0 z-40 mt-1 w-64 rounded-xl border border-border bg-[#0a0a0a]/95 p-2 shadow-2xl backdrop-blur-xl">
                {savedViews.length > 0 ? (
                  <ul className="max-h-48 space-y-0.5 overflow-y-auto">
                    {savedViews.map((view) => (
                      <li key={view.id} className="group flex items-center gap-1">
                        <button
                          onClick={() => applySavedView(view)}
                          className="flex-1 truncate rounded-lg px-2 py-1.5 text-left text-xs text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
                        >
                          {view.name}
                        </button>
                        <button
                          onClick={() => handleDeleteView(view.id)}
                          className="rounded p-1 text-white/20 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                          title="Delete view"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-2 py-1.5 text-xs text-white/30">
                    No saved views yet.
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2">
                  <input
                    type="text"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveView();
                    }}
                    placeholder="Save current view as…"
                    className="h-8 flex-1 rounded-lg border border-border bg-glass-04 px-2 text-xs text-white/70 outline-none placeholder:text-text-faint focus:border-cyan-500/50"
                  />
                  <button
                    onClick={handleSaveView}
                    disabled={!newViewName.trim()}
                    className="h-8 rounded-lg bg-cyan-500 px-2.5 text-xs font-medium text-white transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* View toggle */}
        <div className="flex overflow-hidden rounded-lg border border-border">
          <button
            onClick={() => setViewMode("list")}
            className={`flex h-9 items-center gap-1.5 px-3 text-xs transition-colors ${
              viewMode === "list"
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <ListIcon className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex h-9 items-center gap-1.5 border-l border-border px-3 text-xs transition-colors ${
              viewMode === "table"
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            Table
          </button>
        </div>
      </div>

      {/* Views */}
      {viewMode === "table" ? (
        <TaskTable
          tasks={tableTasks}
          projects={projects}
          members={members}
          onTaskClick={handleTaskClick}
        />
      ) : (
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
                {hasActiveFilters
                  ? "No tasks match the current filters."
                  : "No tasks yet. Create a task to get started."}
              </p>
            </div>
          )}
        </div>
      )}
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
