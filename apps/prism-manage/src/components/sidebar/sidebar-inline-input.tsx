"use client";

import { useRef, useEffect } from "react";
import { Check, X } from "lucide-react";

interface SidebarInlineInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SidebarInlineInput({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = "Name...",
  autoFocus = true,
}: SidebarInlineInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <li className="px-1">
      <div className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-2 py-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
        />
        <button
          onClick={onSave}
          className="rounded p-0.5 text-emerald-400 hover:text-emerald-300"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onCancel}
          className="rounded p-0.5 text-white/40 hover:text-white/70"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
