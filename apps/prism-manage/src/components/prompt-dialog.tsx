"use client";

/**
 * PromptDialog
 * ------------
 * Small controlled input dialog — replaces window.prompt().
 * Enter submits, Escape cancels, backdrop click cancels.
 */

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface PromptDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
}

export function PromptDialog({
  open,
  onClose,
  onSubmit,
  title,
  placeholder,
  defaultValue = "",
  confirmLabel = "Save",
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, defaultValue]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-[#0a0a0a] p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-glass-04 px-3 py-2.5 text-sm text-white/80 outline-none transition-colors placeholder:text-text-faint hover:border-border-active focus:border-cyan-500/50"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3.5 py-2 text-sm text-white/60 transition-colors hover:border-border-active hover:text-white/80"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="rounded-lg bg-cyan-500 px-3.5 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
