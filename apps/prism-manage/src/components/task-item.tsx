"use client";

/**
 * Task Item Component
 * -------------------
 * Individual task row with checkbox, title, and actions.
 */

import { useState } from "react";
import {
  Star,
  MoreVertical,
  Calendar as CalendarIcon,
  Trash2,
} from "lucide-react";
import type { Task } from "@/lib/schemas";

interface TaskItemProps {
  task: Task;
  onToggleComplete?: (id: string) => void;
  onToggleStar?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TaskItem({
  task,
  onToggleComplete,
  onToggleStar,
  onDelete,
}: TaskItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04] ${
        task.completed ? "opacity-50" : ""
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete?.(task.id)}
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          task.completed
            ? "border-cyan-500 bg-cyan-500"
            : "border-white/20 hover:border-cyan-500"
        }`}
      >
        {task.completed && (
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
        <p
          className={`text-sm ${
            task.completed ? "text-white/30 line-through" : "text-white"
          }`}
        >
          {task.title}
        </p>

        {/* Meta Info */}
        {(task.dueDate || task.notes) && (
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/40">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {task.notes && (
              <span className="max-w-[150px] truncate">{task.notes}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Star */}
        <button
          onClick={() => onToggleStar?.(task.id)}
          className={`rounded p-1 transition-colors ${
            task.starred
              ? "text-yellow-400 hover:text-yellow-300"
              : "text-white/30 hover:text-yellow-400"
          }`}
        >
          <Star
            className="h-4 w-4"
            fill={task.starred ? "currentColor" : "none"}
          />
        </button>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
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
              <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-lg border border-white/10 bg-[#0A0A0A] py-1 shadow-xl">
                <button
                  onClick={() => {
                    onDelete?.(task.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5"
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
