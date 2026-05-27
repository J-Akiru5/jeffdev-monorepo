"use client";

/**
 * Intercepted Task Edit Slide-over
 * ---------------------------------
 * When navigated to /tasks/[id]/edit via soft navigation,
 * this intercepting route catches it and renders the TaskSheet
 * as a slide-over overlay for editing existing tasks.
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { TaskSheet } from "@/components/task-sheet";
import type { TaskSheetData } from "@/components/task-sheet";
import { useProjects } from "@/contexts/project-context";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { updateTask } from "@/app/actions/tasks";
import { toast } from "sonner";

export default function InterceptedEditTask() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const { projects } = useProjects();
  const departments = useWorkspaceStore((s) => s.departments);

  const [task, setTask] = useState<TaskSheetData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the task data
  useEffect(() => {
    async function loadTask() {
      try {
        const res = await fetch(`/api/tasks?id=${taskId}`);
        if (!res.ok) throw new Error("Task not found");
        const tasks = await res.json();
        const t = Array.isArray(tasks) ? tasks[0] : tasks;
        if (t) {
          setTask({
            title: t.title,
            taskType: t.taskType || t.task_type || "feature",
            description: t.description || "",
            notes: t.notes || "",
            status: t.status || "backlog",
            priority: t.priority || "medium",
            assignedTo: t.assignedTo || t.assigned_to || "",
            tags: t.tags || [],
            dueDate: t.dueDate || t.due_date || "",
            dueTime: t.dueTime || t.due_time || "",
            projectId: t.projectId || t.project_id || "",
            departmentId: t.departmentId || t.department_id || undefined,
          });
        }
      } catch (err) {
        console.error("Failed to load task:", err);
        toast.error("Failed to load task");
      } finally {
        setLoading(false);
      }
    }
    loadTask();
  }, [taskId]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(
    async (data: TaskSheetData) => {
      try {
        await updateTask(taskId, data as unknown as Record<string, unknown>);
        toast.success("Task updated");
        router.back();
      } catch {
        toast.error("Failed to update task");
      }
    },
    [taskId, router],
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <p className="text-white/60">Task not found</p>
      </div>
    );
  }

  return (
    <TaskSheet
      isOpen
      onClose={handleClose}
      onSubmit={handleSubmit}
      initialData={task}
      projects={projects}
      departments={departments}
      mode="edit"
    />
  );
}
