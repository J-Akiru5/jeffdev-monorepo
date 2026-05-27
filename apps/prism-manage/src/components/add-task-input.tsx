"use client";

/**
 * Add Task Input
 * --------------
 * Quick inline input for adding new tasks.
 * Features:
 * - Title + Enter creates a basic task (defaults to 'feature' type)
 * - Expand button opens the full TaskSheet slide-over for metadata entry
 */

import { useState, useRef, KeyboardEvent } from "react";
import { Plus, Maximize2 } from "lucide-react";
import { TASK_TYPES } from "@/lib/task-types";
import { getTaskTypeConfig } from "@/lib/task-types";
import type { TaskTypeKey } from "@/lib/task-types";

interface AddTaskInputProps {
  projectId: string;
  onAdd?: (title: string, projectId: string) => void;
  onExpand?: (title: string, projectId: string) => void;
  defaultType?: TaskTypeKey;
}

export function AddTaskInput({
  projectId,
  onAdd,
  onExpand,
  defaultType = "feature",
}: AddTaskInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const typeConfig = getTaskTypeConfig(defaultType);

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd?.(value.trim(), projectId);
      setValue("");
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setValue("");
      setIsExpanded(false);
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleOpenSheet = () => {
    onExpand?.(value.trim(), projectId);
    setValue("");
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border p-3 text-sm text-text-muted transition-all hover:border-cyan-500/30 hover:text-cyan-400"
      >
        <Plus className="h-4 w-4" />
        <span className="flex-1 text-left">Add a task</span>
        <span className="flex items-center gap-1 text-[10px] text-text-faint">
          {typeConfig.icon}
        </span>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-cyan-500/30 glass-subtle">
      <div className="flex items-center gap-2 px-4">
        {/* Type indicator */}
        <span className="flex-shrink-0 text-sm">{typeConfig.icon}</span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!value.trim()) setIsExpanded(false);
          }}
          placeholder='Task title... (press Enter for quick-add)'
          className="flex-1 bg-transparent py-3 text-sm text-text-primary placeholder:text-text-quiet focus:outline-none"
        />

        {/* Expand to sheet button */}
        <button
          onClick={handleOpenSheet}
          disabled={!value.trim()}
          title="Open full task form"
          className="flex-shrink-0 rounded-md p-1.5 text-text-quiet transition-colors hover:bg-glass-05 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-glass-05 glass-subtle px-3 py-2">
        <button
          onClick={() => {
            setValue("");
            setIsExpanded(false);
          }}
          className="rounded-md px-3 py-1.5 text-xs text-text-tertiary hover:bg-glass-05 hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
