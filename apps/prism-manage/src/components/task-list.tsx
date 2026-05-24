"use client";

/**
 * Task List Component
 * -------------------
 * Container for displaying tasks grouped by project.
 */

import { TaskItem } from "./task-item";
import { AddTaskInput } from "./add-task-input";
import type { Task, Project } from "@/lib/schemas";

interface TaskListProps {
  tasks: Task[];
  project: Project;
  onToggleComplete?: (id: string) => void;
  onToggleStar?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: (title: string, projectId: string) => void;
}

export function TaskList({
  tasks,
  project,
  onToggleComplete,
  onToggleStar,
  onDelete,
  onAdd,
}: TaskListProps) {
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-4">
      {/* Project Header */}
      <div className="flex items-center gap-3">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: project.color || "#06b6d4" }}
        />
        <h2 className="text-lg font-semibold text-white">{project.name}</h2>
        <span className="font-mono text-xs text-white/30">
          {incompleteTasks.length}
        </span>
      </div>

      {/* Add Task Input */}
      <AddTaskInput projectId={project.id} onAdd={onAdd} />

      {/* Incomplete Tasks */}
      <div className="space-y-2">
        {incompleteTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            onToggleStar={onToggleStar}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Completed Tasks (Collapsed) */}
      {completedTasks.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2 py-2 text-sm text-white/40 transition-colors hover:text-white/60">
              <svg
                className="h-4 w-4 transition-transform group-open:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Completed ({completedTasks.length})
            </div>
          </summary>
          <div className="mt-2 space-y-2">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onToggleStar={onToggleStar}
                onDelete={onDelete}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
