"use client";

/**
 * TaskSheet Component (Slide-Over)
 * ---------------------------------
 * Right-side slide-over panel for creating and editing tasks.
 * Supports workspace-aware department selection and RBAC status restrictions.
 * On mobile (small viewports), renders as a full-screen sheet.
 */

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Tag,
  Calendar,
  Clock,
} from "lucide-react";
import { TASK_TYPES, PRIORITY_CONFIG, STATUS_CONFIG, STAFF_LOCKED_STATUSES } from "@/lib/task-types";
import type { TaskTypeKey, StatusKey } from "@/lib/task-types";
import type { Task, Project, Department } from "@/lib/schemas";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Select } from "@syntaxure/ui";

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
  departmentId?: string;
}

interface TaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskSheetData) => Promise<void>;
  initialData?: Partial<TaskSheetData>;
  projects: Project[];
  departments?: Department[];
  mode?: "create" | "edit";
  /** Whether the sheet is rendering inside an intercepting route modal (no layout wrapper) */
  isIntercepted?: boolean;
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
  departmentId: undefined,
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
  departments = [],
  mode = "create",
  isIntercepted = true,
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

  /** Is the current user a founder? Reads from workspace store (hydrated from DB) */
  const userRole = useWorkspaceStore((s) => s.userRole);
  const cLevelTitle = useWorkspaceStore((s) => s.cLevelTitle);
  const isFounder = userRole === "founder";
  const isEmployee = userRole === "employee";

  // Approval rights: CPO and CEO can approve tasks; other C-level / employees cannot
  const canApprove = isFounder && (cLevelTitle === null || cLevelTitle === "ceo" || cLevelTitle === "cpo");

  // Determine which statuses are available for selection based on RBAC
  const availableStatuses = Object.entries(STATUS_CONFIG).filter(([key]) => {
    if (canApprove) return true;
    return !STAFF_LOCKED_STATUSES.includes(key as StatusKey);
  });

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setData({
        ...DEFAULT_DATA,
        ...initialData,
        projectId: initialData?.projectId || projects[0]?.id || "",
        departmentId: initialData?.departmentId || departments[0]?.id || undefined,
      });
      setTagInput("");
      // Focus title after animation
      setTimeout(() => titleRef.current?.focus(), 150);
    }
  }, [isOpen, initialData, projects, departments]);

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
          {isIntercepted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
          )}

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ x: isIntercepted ? "100%" : 0, opacity: isIntercepted ? 1 : 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isIntercepted ? "100%" : 0, opacity: isIntercepted ? 1 : 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`${
              isIntercepted
                ? "fixed inset-y-0 right-0 z-50 w-full max-w-[640px] border-l border-border bg-elevated shadow-2xl"
                : "relative w-full max-w-2xl rounded-xl border border-border bg-elevated shadow-2xl"
            } max-h-screen overflow-hidden sm:max-h-none`}
          >
            <div className="flex h-full flex-col">
              {/* ── Header ── */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  {/* Department Selector (when departments exist) */}
                  {departments.length > 0 && data.departmentId !== undefined && (
                    <Select
                      value={data.departmentId}
                      onChange={(val) =>
                        setData((prev) => ({
                          ...prev,
                          departmentId: val,
                        }))
                      }
                      options={departments.map((dept) => ({
                        value: dept.id,
                        label: dept.name,
                      }))}
                      buttonClassName="h-9 rounded-lg border border-border bg-glass-04 text-xs text-text-secondary hover:border-border-active hover:bg-black/30 focus:border-cyan-500/50 py-1.5 px-3 min-w-[130px]"
                      optionsClassName="min-w-[150px]"
                    />
                  )}

                  {/* Project Selector */}
                  <Select
                    value={data.projectId}
                    onChange={(val) =>
                      setData((prev) => ({
                        ...prev,
                        projectId: val,
                      }))
                    }
                    options={projects.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    buttonClassName="h-9 rounded-lg border border-border bg-glass-04 text-xs text-text-secondary hover:border-border-active hover:bg-black/30 focus:border-cyan-500/50 py-1.5 px-3 min-w-[130px]"
                    optionsClassName="min-w-[150px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!data.title.trim() || submitting}
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Creating..."
                      : mode === "create"
                        ? "Create Task"
                        : "Save Changes"}
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-glass-05 hover:text-text-primary"
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
                      className="w-full resize-none bg-transparent text-2xl font-bold text-text-primary placeholder:text-text-faint focus:outline-none"
                    />
                  </div>

                  {/* Type Selector */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
                      Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                                : "border-border glass-subtle text-text-tertiary hover:border-border-active hover:text-text-secondary"
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
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
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
                      className="w-full resize-none rounded-xl border border-border glass-subtle px-4 py-3 text-sm text-text-secondary placeholder:text-text-faint focus:border-cyan-500/30 focus:outline-none"
                    />
                  </div>

                  {/* ── Metadata Grid ── */}
                  <div>
                    <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-text-muted">
                      Details
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Status (RBAC-aware) */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-text-muted">
                          Status
                          {isEmployee && (
                            <span className="ml-1.5 text-[10px] text-amber-400/60">
                              (employee)
                            </span>
                          )}
                        </label>
                        <Select
                          value={data.status}
                          onChange={(val) =>
                            setData((prev) => ({
                              ...prev,
                              status: val as Task["status"],
                            }))
                          }
                          options={availableStatuses.map(([key, config]) => {
                            const isLocked = STAFF_LOCKED_STATUSES.includes(key as StatusKey);
                            return {
                              value: key,
                              label: `${config.label}${isLocked && !canApprove ? " (approval required)" : ""}`,
                              disabled: isLocked && !canApprove,
                              icon: (
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: config.color }}
                                />
                              ),
                            };
                          })}
                          buttonClassName="bg-glass-04 border border-border focus:border-cyan-500/50 h-10"
                        />
                        {!canApprove && data.status === "approved" && (
                          <p className="mt-1 text-[10px] text-amber-400/60">
                            Only CPO or CEO can set &quot;Approved&quot;
                          </p>
                        )}
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-text-muted">
                          Priority
                        </label>
                        <Select
                          value={data.priority}
                          onChange={(val) =>
                            setData((prev) => ({
                              ...prev,
                              priority: val as Task["priority"],
                            }))
                          }
                          options={Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
                            value: key,
                            label: config.label,
                            icon: (
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: config.color }}
                              />
                            ),
                          }))}
                          buttonClassName="bg-glass-04 border border-border focus:border-cyan-500/50 h-10"
                        />
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-text-muted">
                          Due Date
                        </label>
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-quiet" />
                          <input
                            type="date"
                            value={data.dueDate}
                            onChange={(e) =>
                              setData((prev) => ({
                                ...prev,
                                dueDate: e.target.value,
                              }))
                            }
                            className="w-full appearance-none rounded-lg border border-border bg-glass-04 px-3 py-2.5 pl-10 text-sm text-text-secondary outline-none transition-colors hover:border-border-active focus:border-cyan-500/50"
                          />
                        </div>
                      </div>

                      {/* Due Time */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-text-muted">
                          Due Time
                        </label>
                        <div className="relative">
                          <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-quiet" />
                          <input
                            type="time"
                            value={data.dueTime}
                            onChange={(e) =>
                              setData((prev) => ({
                                ...prev,
                                dueTime: e.target.value,
                              }))
                            }
                            className="w-full appearance-none rounded-lg border border-border bg-glass-04 px-3 py-2.5 pl-10 text-sm text-text-secondary outline-none transition-colors hover:border-border-active focus:border-cyan-500/50"
                          />
                        </div>
                      </div>

                      {/* Assignee */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-text-muted">
                          Assignee
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-quiet" />
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
                            className="w-full rounded-lg border border-border bg-glass-04 px-3 py-2.5 pl-10 text-sm text-text-secondary outline-none transition-colors placeholder:text-text-faint hover:border-border-active focus:border-cyan-500/50"
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="mb-1.5 block text-[11px] text-text-muted">
                          Tags
                        </label>
                        <div className="relative">
                          <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-quiet" />
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
                            className="w-full rounded-lg border border-border bg-glass-04 px-3 py-2.5 pl-10 text-sm text-text-secondary outline-none transition-colors placeholder:text-text-faint hover:border-border-active focus:border-cyan-500/50"
                          />
                        </div>
                        {data.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {data.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-glass-04 px-2.5 py-1 text-[11px] text-text-tertiary"
                              >
                                {tag}
                                <button
                                  onClick={() => removeTag(tag)}
                                  className="ml-0.5 text-text-quiet hover:text-text-tertiary"
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
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
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
                      className="w-full resize-none rounded-xl border border-border glass-subtle px-4 py-3 text-sm text-text-tertiary placeholder:text-text-faint focus:border-cyan-500/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="border-t border-border px-6 py-3">
                <p className="text-xs text-text-quiet">
                  <kbd className="rounded border border-border bg-glass-04 px-1.5 py-0.5 font-mono text-[11px]">
                    ⌘⏎
                  </kbd>{" "}
                  to save &middot;{" "}
                  <kbd className="rounded border border-border bg-glass-04 px-1.5 py-0.5 font-mono text-[11px]">
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
