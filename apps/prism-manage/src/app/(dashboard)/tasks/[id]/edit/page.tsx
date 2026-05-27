"use client";

/**
 * Edit Task Page (Full Page)
 * ---------------------------
 * Full-page version of the task edit view.
 * Used when a user hard-navigates (or refreshes) to /tasks/[id]/edit.
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { TaskSheet } from "@/components/task-sheet";
import type { TaskSheetData } from "@/components/task-sheet";
import { useProjects } from "@/contexts/project-context";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { updateTask } from "@/app/actions/tasks";
import { toast } from "sonner";

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const { projects } = useProjects();
  const departments = useWorkspaceStore((s) => s.departments);

  const [task, setTask] = useState<TaskSheetData | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch {
        toast.error("Failed to load task");
      } finally {
        setLoading(false);
      }
    }
    loadTask();
  }, [taskId]);

  const handleClose = useCallback(() => {
    router.push("/tasks");
  }, [router]);

  const handleSubmit = useCallback(
    async (data: TaskSheetData) => {
      try {
        await updateTask(taskId, data as unknown as Record<string, unknown>);
        toast.success("Task updated");
        router.push("/tasks");
      } catch {
        toast.error("Failed to update task");
      }
    },
    [taskId, router],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto max-w-4xl flex items-center justify-center min-h-[60vh]">
        <p className="text-white/60">Task not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-center min-h-[80vh]">
        <TaskSheet
          isOpen
          onClose={handleClose}
          onSubmit={handleSubmit}
          initialData={task}
          projects={projects}
          departments={departments}
          mode="edit"
          isIntercepted={false}
        />
      </div>
    </div>
  );
}
