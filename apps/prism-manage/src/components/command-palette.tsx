"use client";

/**
 * CommandPalette
 * --------------
 * ⌘K command palette overlay for quick navigation and actions.
 * Supports keyboard navigation (arrows, enter, escape) and fuzzy-like filtering.
 *
 * Sections:
 *   - Workspaces (switch active workspace)
 *   - Views (navigate to Dashboard, Tasks, Calendar, Kanban)
 *   - Quick Actions (create task)
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  User,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  LayoutGrid,
  Plus,
  Command,
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  action: () => void;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // ── Build Items (memoized) ──

  const workspaceItems: PaletteItem[] = useMemo(
    () =>
      workspaces.map((ws) => ({
        id: `ws-${ws.id}`,
        label: ws.name,
        description:
          ws.name === "Personal"
            ? "Personal tasks & lists"
            : "Workspace tasks & departments",
        icon: ws.name === "Personal" ? User : Building2,
        section: "workspaces" as const,
        action: () => {
          setActiveWorkspace(ws.id);
          router.push("/tasks");
          onClose();
        },
      })),
    [workspaces, setActiveWorkspace, router, onClose],
  );

  const viewItems: PaletteItem[] = useMemo(
    () => [
      {
        id: "view-dashboard",
        label: "Dashboard",
        description: "Executive overview & KPIs",
        icon: LayoutDashboard,
        section: "views",
        action: () => {
          router.push("/dashboard");
          onClose();
        },
      },
      {
        id: "view-tasks",
        label: "Tasks",
        description: "View all tasks",
        icon: CheckSquare,
        section: "views",
        action: () => {
          router.push("/tasks");
          onClose();
        },
      },
      {
        id: "view-calendar",
        label: "Calendar",
        description: "Calendar view",
        icon: Calendar,
        section: "views",
        action: () => {
          router.push("/calendar");
          onClose();
        },
      },
      {
        id: "view-kanban",
        label: "Kanban",
        description: "Kanban board view",
        icon: LayoutGrid,
        section: "views",
        action: () => {
          router.push("/kanban");
          onClose();
        },
      },
    ],
    [router, onClose],
  );

  const actionItems: PaletteItem[] = useMemo(
    () => [
      {
        id: "action-create-task",
        label: "Create Task",
        description: "Open the task creation slide-over",
        icon: Plus,
        section: "actions",
        action: () => {
          router.push("/tasks/new");
          onClose();
        },
      },
    ],
    [router, onClose],
  );

  // ── Squash items into flat array for efficient filtering (memoized) ──
  const allItems = useMemo(
    () => [...workspaceItems, ...viewItems, ...actionItems],
    [workspaceItems, viewItems, actionItems],
  );

  const sections = useMemo(
    () => [
      { id: "workspaces", label: "Workspaces", items: workspaceItems },
      { id: "views", label: "Views", items: viewItems },
      { id: "actions", label: "Quick Actions", items: actionItems },
    ],
    [workspaceItems, viewItems, actionItems],
  );

  // ── Filter — single pass through flat list, memoized per query ──
  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q),
    );
  }, [allItems, query]);

  // ── Build section groupings from pre-filtered flat list ──
  const filteredSections = useMemo(() => {
    if (!query.trim())
      return sections.map((s) => ({ ...s, show: s.items.length > 0 }));
    const q = query.toLowerCase();
    return sections
      .map((s) => {
        const matching = s.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            (item.description || "").toLowerCase().includes(q),
        );
        return { ...s, items: matching, show: matching.length > 0 };
      })
      .filter((s) => s.show);
  }, [sections, query]);

  const hasResults = filtered.length > 0;

  // Keyboard navigation index maps to flat filtered list
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex]!.action();
      }
    },
    [filtered, selectedIndex],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-1/2 top-[15%] z-[61] w-full max-w-lg -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-[#0a0a0a] shadow-2xl shadow-black/40">
              {/* Search Input */}
              <div className="flex items-center border-b border-border px-4">
                <Search className="h-4 w-4 text-white/40" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search workspaces, views, actions..."
                  className="flex-1 bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-white/40 outline-none"
                />
                <kbd className="rounded border border-border bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-white/40">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto py-2">
                {!hasResults && (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <Command className="h-8 w-8 text-white/30" />
                    <p className="text-sm text-white/40">
                      No results for &ldquo;{query}&rdquo;
                    </p>
                  </div>
                )}

                {hasResults && (
                  <div
                    onMouseLeave={() => setSelectedIndex(-1)}
                  >
                    {filteredSections.map((section) => (
                      <div key={section.id}>
                        {/* Section header */}
                        <div className="px-4 py-2">
                          <h3 className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                            {section.label}
                          </h3>
                        </div>

                        {/* Section items */}
                        {section.items.map((item) => {
                          // Map to flat index for keyboard navigation
                          const flatIndex = filtered.indexOf(item);
                          const isSelected = flatIndex === selectedIndex;
                          const Icon = item.icon;

                          return (
                            <button
                              key={item.id}
                              onClick={item.action}
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                isSelected
                                  ? "bg-cyan-500/10 text-white"
                                  : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                              }`}
                            >
                              <Icon
                                className={`h-4 w-4 flex-shrink-0 ${
                                  section.id === "workspaces"
                                    ? "text-cyan-400"
                                    : section.id === "views"
                                      ? "text-purple-400"
                                      : "text-emerald-400"
                                }`}
                              />
                              <div className="flex-1 truncate">
                                <span className="font-medium">{item.label}</span>
                                {item.description && (
                                  <span className="ml-2 text-[11px] text-white/40">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <kbd className="rounded border border-border bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-white/40">
                                  ↵
                                </kbd>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-border px-4 py-2">
                <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                  <kbd className="rounded border border-border bg-white/[0.08] px-1.5 py-0.5 font-mono">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                  <kbd className="rounded border border-border bg-white/[0.08] px-1.5 py-0.5 font-mono">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                  <kbd className="rounded border border-border bg-white/[0.08] px-1.5 py-0.5 font-mono">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
