'use client';

/**
 * Add Task Input
 * --------------
 * Quick inline input for adding new tasks.
 */

import { useState, useRef, KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';

interface AddTaskInputProps {
  projectId: string;
  onAdd?: (title: string, projectId: string) => void;
}

export function AddTaskInput({ projectId, onAdd }: AddTaskInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd?.(value.trim(), projectId);
      setValue('');
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setValue('');
      setIsExpanded(false);
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="flex w-full items-center gap-3 rounded-lg border border-dashed border-white/10 p-3 text-sm text-white/40 transition-all hover:border-cyan-500/30 hover:text-cyan-400"
      >
        <Plus className="h-4 w-4" />
        Add a task
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-cyan-500/30 bg-white/[0.02]">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!value.trim()) setIsExpanded(false);
        }}
        placeholder="Task title..."
        className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
      />
      <div className="flex items-center justify-end gap-2 border-t border-white/5 bg-white/[0.02] px-3 py-2">
        <button
          onClick={() => {
            setValue('');
            setIsExpanded(false);
          }}
          className="rounded-md px-3 py-1.5 text-xs text-white/50 hover:bg-white/5 hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-void transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
