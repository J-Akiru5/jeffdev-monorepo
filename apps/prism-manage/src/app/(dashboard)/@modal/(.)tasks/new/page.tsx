"use client";

/**
 * Intercepted Task Creation Slide-over
 * -------------------------------------
 * When navigated to /tasks/new via soft navigation (client-side),
 * this intercepting route (.) catches it and renders the TaskSheet
 * as a slide-over overlay instead of a full page.
 * On hard navigation/refresh, it falls back to the full page at /tasks/new.
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { TaskSheet } from "@/components/task-sheet";
import type { TaskSheetData } from "@/components/task-sheet";
import { useProjects } from "@/contexts/project-context";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { createTask } from "@/app/actions/tasks";
import { toast } from "sonner";

export default function InterceptedNewTask() {
  const router = useRouter();
  const { projects } = useProjects();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const departments = useWorkspaceStore((s) => s.departments);

  const handleClose = useCallback(() => {
    router.back();
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
        router.back();
      } catch {
        toast.error("Failed to create task");
      }
    },
    [activeWorkspaceId, router],
  );

  return (
    <TaskSheet
      isOpen
      onClose={handleClose}
      onSubmit={handleSubmit}
      projects={projects}
      departments={departments}
      mode="create"
    />
  );
}
