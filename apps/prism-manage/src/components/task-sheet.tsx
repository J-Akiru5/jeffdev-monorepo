"use client";

/**
 * TaskSheet Component (Slide-Over)
 * ---------------------------------
 * Right-side slide-over panel for creating and editing tasks.
 * Opens with a smooth animation and provides the full task creation UI.
 */

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  User,
  Tag,
  Calendar,
  Clock,
} from "lucide-react";
import { TASK_TYPES, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/task-types";
import type { TaskTypeKey } from "@/lib/task-types";
import type { Task, Project } from "@/lib/schemas";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface TaskSheetData {
  title: string;
  taskType: TaskTypeKey;
  description: string;
  notes: string;
  status: Task["status"];
  priority: Task["priority"];
  assignedTo: string;
  tags: string[];
  dueDate: string;
  dueTime: string;
  projectId: string;
}

interface TaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskSheetData) => Promise<void>;
  initialData?: Partial<TaskSheetData>;
  projects: Project[];
  mode?: "create" | "edit";
}

// ──────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────

const DEFAULT_DATA: TaskSheetData = {
  title: "",
  taskType: "feature",
  description: "",
  notes: "",
  status: "todo",
  priority: "medium",
  assignedTo: "",
  tags: [],
  dueDate: "",
  dueTime: "",
  projectId: "",
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function TaskSheet({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects,
  mode = "create",
}: TaskSheetProps) {
  const [data, setData] = useState<TaskSheetData>({
    ...DEFAULT_DATA,
    ...initialData,
    projectId: initialData?.projectId || projects[0]?.id || "",
  });
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setData({
        ...DEFAULT_DATA,
        ...initialData,
        projectId: initialData?.projectId || projects[0]?.id || "",
      });
      setTagInput("");
      // Focus title after animation
      setTimeout(() => titleRef.current?.focus(), 150);
    }
  }, [isOpen, initialData, projects]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-expand textarea
  const autoExpand = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const handleSubmit = async () => {
    if (!data.title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...data,
        title: data.title.trim(),
        tags: data.tags.filter(Boolean),
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !data.tags.includes(tag)) {
      setData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // ── Type Selector ──

  const typeOptions = Object.entries(TASK_TYPES).map(([key, config]) => ({
    key: key as TaskTypeKey,
    ...config,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[640px] border-l border-white/10 bg-elevated shadow-2xl"
          >
            <div className="flex h-full flex-col">
              {/* ── Header ── */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  {/* Project Selector */}
                  <div className="relative">
                    <select
                      value={data.projectId}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          projectId: e.target.value,
                        }))
                      }
                      className="appearance-none rounded-lg border border-white/10 bg-glass-04 px-3 py-2 pr-8 text-sm text-white/80 outline-none transition-colors hover:border-white/20 focus:border-cyan-500/50"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!data.title.trim() || submitting}
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-void transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Creating..."
                      : mode === "create"
                        ? "Create Task"
                        : "Save Changes"}
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-white/40 transition-colors hover:bg-glass-05 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* ── Content ── */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <textarea
                      ref={titleRef}
                      value={data.title}
                      onChange={(e) => {
                        setData((prev) => ({ ...prev, title: e.target.value }));
                        autoExpand(e.target);
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={(e) => autoExpand(e.target)}
                      placeholder="Task title..."
                      rows={1}
                      className="w-full resize-none bg-transparent text-2xl font-bold text-white placeholder:text-white/20 focus:outline-none"
                    />
                  </div>

                  {/* Type Selector */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
                      Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {typeOptions.map((opt) => {
                        const isActive = data.taskType === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() =>
                              setData((prev) => ({
                                ...prev,
                                taskType: opt.key,
                              }))
                            }
                            className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs transition-all ${
                              isActive
                                ? "border-transparent shadow-sm"
                                : "border-white/10 glass-subtle text-white/50 hover:border-white/20 hover:text-white/70"
                            }`}
                            style={
                              isActive
                                ? {
                                    borderColor: opt.borderColor,
                                    background: opt.bgColor,
                                    color: opt.textColor,
                                  }
                                : undefined
                            }
                          >
                            <span className="text-lg">{opt.icon}</span>
                            <span className="font-medium leading-tight">
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
                      Description
                    </label>
                    <textarea
                      value={data.description}
                      onChange={(e) => {
                        setData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                        autoExpand(e.target);
                      }}
                      placeholder="Add reproduction steps, acceptance criteria, or error logs..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-white/10 glass-subtle px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none"
                    />
                  </div>

                  {/* ── Metadata Grid ── */}
                  <div>
                    <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-white/40">
                      Details
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Status */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-white/40">
                          Status
                        </label>
                        <select
                          value={data.status}
                          onChange={(e) =>
                            setData((prev) => ({
                              ...prev,
                              status: e.target.value as Task["status"],
                            }))
                          }
                          className="w-full appearance-none rounded-lg border border-white/10 bg-glass-04 px-3 py-2.5 text-sm text-white/80 outline-none transition-colors hover:border-white/20 focus:border-cyan-500/50"
                        >
                          {Object.entries(STATUS_CONFIG).map(
                            ([key, config]) => (
                              <option key={key} value={key}>
                                {config.label}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-white/40">
                          Priority
                        </label>
                        <select
                          value={data.priority}
                          onChange={(e) =>
                            setData((prev) => ({
                              ...prev,
                              priority: e.target.value as Task["priority"],
                            }))
                          }
                          className="w-full appearance-none rounded-lg border border-white/10 bg-glass-04 px-3 py-2.5 text-sm text-white/80 outline-none transition-colors hover:border-white/20 focus:border-cyan-500/50"
                        >
                          {Object.entries(PRIORITY_CONFIG).map(
                            ([key, config]) => (
                              <option key={key} value={key}>
                                {config.label}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-white/40">
                          Due Date
                        </label>
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                          <input
                            type="date"
                            value={data.dueDate}
                            onChange={(e) =>
                              setData((prev) => ({
                                ...prev,
                                dueDate: e.target.value,
                              }))
                            }
                            className="w-full appearance-none rounded-lg border border-white/10 bg-glass-04 px-3 py-2.5 pl-10 text-sm text-white/80 outline-none transition-colors hover:border-white/20 focus:border-cyan-500/50"
                          />
                        </div>
                      </div>

                      {/* Due Time */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-white/40">
                          Due Time
                        </label>
                        <div className="relative">
                          <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                          <input
                            type="time"
                            value={data.dueTime}
                            onChange={(e) =>
                              setData((prev) => ({
                                ...prev,
                                dueTime: e.target.value,
                              }))
                            }
                            className="w-full appearance-none rounded-lg border border-white/10 bg-glass-04 px-3 py-2.5 pl-10 text-sm text-white/80 outline-none transition-colors hover:border-white/20 focus:border-cyan-500/50"
                          />
                        </div>
                      </div>

                      {/* Assignee */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-white/40">
                          Assignee
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                          <input
                            type="text"
                            value={data.assignedTo}
                            onChange={(e) =>
                              setData((prev) => ({
                                ...prev,
                                assignedTo: e.target.value,
                              }))
                            }
                            placeholder="User ID"
                            className="w-full rounded-lg border border-white/10 bg-glass-04 px-3 py-2.5 pl-10 text-sm text-white/80 outline-none transition-colors placeholder:text-white/20 hover:border-white/20 focus:border-cyan-500/50"
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-white/40">
                          Tags
                        </label>
                        <div className="relative">
                          <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addTag();
                              }
                            }}
                            onBlur={addTag}
                            placeholder="Add tag..."
                            className="w-full rounded-lg border border-white/10 bg-glass-04 px-3 py-2.5 pl-10 text-sm text-white/80 outline-none transition-colors placeholder:text-white/20 hover:border-white/20 focus:border-cyan-500/50"
                          />
                        </div>
                        {data.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {data.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-glass-04 px-2.5 py-1 text-[11px] text-white/60"
                              >
                                {tag}
                                <button
                                  onClick={() => removeTag(tag)}
                                  className="ml-0.5 text-white/30 hover:text-white/60"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
                      Internal Notes
                    </label>
                    <textarea
                      value={data.notes}
                      onChange={(e) => {
                        setData((prev) => ({ ...prev, notes: e.target.value }));
                        autoExpand(e.target);
                      }}
                      placeholder="Add internal notes..."
                      rows={2}
                      className="w-full resize-none rounded-xl border border-white/10 glass-subtle px-4 py-3 text-sm text-white/60 placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="border-t border-white/10 px-6 py-3">
                <p className="text-xs text-white/30">
                  <kbd className="rounded border border-white/10 bg-glass-04 px-1.5 py-0.5 font-mono text-[11px]">
                    ⌘⏎
                  </kbd>{" "}
                  to save &middot;{" "}
                  <kbd className="rounded border border-white/10 bg-glass-04 px-1.5 py-0.5 font-mono text-[11px]">
                    Esc
                  </kbd>{" "}
                  to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
