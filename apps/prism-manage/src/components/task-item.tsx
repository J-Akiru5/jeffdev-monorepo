"use client";

/**
 * Task Item Component
 * -------------------
 * Individual task row with type icon, checkbox, title, and actions.
 * Displays a color-coded icon (✨ 💡 🐛 🚨) to the left of the title
 * for quick visual scanning of task types.
 */

import { useState } from "react";
import {
  Star,
  MoreVertical,
  Calendar as CalendarIcon,
  Trash2,
  User,
} from "lucide-react";
import type { Task } from "@/lib/schemas";
import { getTaskTypeConfig } from "@/lib/task-types";

interface TaskItemProps {
  task: Task;
  onToggleComplete?: (id: string) => void;
  onToggleStar?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function TaskItem({
  task,
  onToggleComplete,
  onToggleStar,
  onDelete,
  onClick,
}: TaskItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const typeConfig = getTaskTypeConfig(task.taskType);
  const isCompleted = task.status === "done";
  const isInProgress = task.status === "in_progress";

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border border-white/5 glass-subtle p-3 transition-all hover:border-white/10 hover:bg-glass-04 ${
        isCompleted ? "opacity-50" : ""
      } ${isInProgress ? "border-l-2 border-l-blue-500/40" : ""}`}
    >
      {/* Type Icon */}
      <button
        onClick={() => onClick?.(task.id)}
        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-xs transition-transform hover:scale-110"
        title={typeConfig.label}
      >
        {typeConfig.icon}
      </button>

      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete?.(task.id)}
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          isCompleted
            ? "border-cyan-500 bg-cyan-500"
            : "border-white/20 hover:border-cyan-500"
        }`}
      >
        {isCompleted && (
          <svg
            className="h-3 w-3 text-void"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Clickable title area */}
        <button
          onClick={() => onClick?.(task.id)}
          className="w-full text-left"
        >
          <p
            className={`text-sm ${
              isCompleted ? "text-white/30 line-through" : "text-white"
            }`}
          >
            {task.title}
          </p>
        </button>

        {/* Meta Info Row */}
        <div className="mt-1 flex items-center gap-2 text-[11px] text-white/40">
          {/* Task type label (visible on hover / when space allows) */}
          <span
            className="hidden items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex"
            style={{
              color: typeConfig.textColor,
              background: typeConfig.bgColor,
            }}
          >
            {typeConfig.icon} {typeConfig.label}
          </span>

          {/* Due date */}
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}

          {/* Assignee */}
          {task.assignedTo && (
            <span className="flex items-center gap-1" title={task.assignedTo}>
              <User className="h-3 w-3" />
              {task.assignedTo.slice(0, 8)}...
            </span>
          )}

          {/* Priority indicator */}
          {task.priority === "high" && (
            <span className="text-red-400">!!</span>
          )}

          {/* Description preview */}
          {task.description && !task.dueDate && (
            <span className="max-w-[150px] truncate text-white/30">
              {task.description}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Star */}
        <button
          onClick={() => onToggleStar?.(task.id)}
          className={`rounded p-1 transition-colors ${
            task.isStarred
              ? "text-yellow-400 hover:text-yellow-300"
              : "text-white/30 hover:text-yellow-400"
          }`}
        >
          <Star
            className="h-4 w-4"
            fill={task.isStarred ? "currentColor" : "none"}
          />
        </button>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded p-1 text-white/30 transition-colors hover:text-white"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Dropdown */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-lg border border-white/10 bg-elevated py-1 shadow-xl">
                <button
                  onClick={() => {
                    onClick?.(task.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/60 hover:bg-glass-05 hover:text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete?.(task.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-glass-05"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
