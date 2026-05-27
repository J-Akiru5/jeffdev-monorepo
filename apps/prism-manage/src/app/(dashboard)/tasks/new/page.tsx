"use client";

/**
 * New Task Page (Full Page)
 * --------------------------
 * Full-page version of the task creation view.
 * Used when a user hard-navigates (or refreshes) to /tasks/new.
 * Shares the same TaskSheet component as the intercepting route,
 * but renders it as a centered modal page.
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { TaskSheet } from "@/components/task-sheet";
import type { TaskSheetData } from "@/components/task-sheet";
import { useProjects } from "@/contexts/project-context";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { createTask } from "@/app/actions/tasks";
import { toast } from "sonner";

export default function NewTaskPage() {
  const router = useRouter();
  const { projects } = useProjects();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const departments = useWorkspaceStore((s) => s.departments);

  const handleClose = useCallback(() => {
    router.push("/tasks");
  }, [router]);

  const handleSubmit = useCallback(
    async (data: TaskSheetData) => {
      try {
        await createTask({
          title: data.title,
          projectId: data.projectId,
          workspaceId: activeWorkspaceId || undefined,
          departmentId: data.departmentId || undefined,
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
        toast.success("Task created");
        router.push("/tasks");
      } catch {
        toast.error("Failed to create task");
      }
    },
    [activeWorkspaceId, router],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-center min-h-[80vh]">
        <TaskSheet
          isOpen
          onClose={handleClose}
          onSubmit={handleSubmit}
          projects={projects}
          departments={departments}
          mode="create"
          isIntercepted={false}
        />
      </div>
    </div>
  );
}
