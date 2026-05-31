"use client";

/**
 * KeyboardShortcutsHelp
 * ----------------------
 * Modal dialog that lists all available keyboard shortcuts in a clean,
 * searchable (or simply grouped) format. Shared by all Syntaxure apps.
 *
 * Displays the standard shared shortcuts (⌘K, ⌘B, ⌘/, ⌘⇧/) plus any
 * app-specific shortcuts passed via `appShortcuts`.
 *
 * @example
 * <KeyboardShortcutsHelp
 *   open={helpOpen}
 *   onClose={() => setHelpOpen(false)}
 *   appShortcuts={[
 *     { key: "n", meta: true, description: "New Task" },
 *   ]}
 * />
 */

import { useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";
import { cn } from "./utils";
import {
  ALL_SHORTCUTS,
  getShortcutLabel,
  type KeyboardShortcutDef,
} from "./keyboard-shortcuts";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShortcutsHelpShortcut extends KeyboardShortcutDef {
  /** Optional category/group label (default: "App Shortcuts" for extras) */
  category?: string;
}

export interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  /** App-specific shortcuts to show alongside the standard ones */
  appShortcuts?: ShortcutsHelpShortcut[];
  /** Override the standard shortcuts shown (defaults to ALL_SHORTCUTS) */
  standardShortcuts?: KeyboardShortcutDef[];
  /** Title shown at the top (default: "Keyboard Shortcuts") */
  title?: string;
}

// ─── Group standard shortcuts into categories ──────────────────────────────────

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string; description: string }[];
}

function buildShortcutGroups(
  all: KeyboardShortcutDef[],
  extras?: ShortcutsHelpShortcut[],
): ShortcutGroup[] {
  const groups: ShortcutGroup[] = [];

  // Navigation & action (⌘K, ⌘B, ⌘/)
  const standard: { keys: string; description: string }[] = [];
  for (const s of all) {
    standard.push({
      keys: getShortcutLabel(s),
      description: s.description,
    });
  }
  if (standard.length > 0) {
    groups.push({ label: "Global", shortcuts: standard });
  }

  // App-specific extras
  if (extras && extras.length > 0) {
    // Group by category if provided
    const byCategory = new Map<string, { keys: string; description: string }[]>();
    for (const s of extras) {
      const cat = s.category || "App Shortcuts";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push({
        keys: getShortcutLabel(s),
        description: s.description,
      });
    }
    for (const [label, shortcuts] of byCategory) {
      groups.push({ label, shortcuts });
    }
  }

  return groups;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KeyboardShortcutsHelp({
  open,
  onClose,
  appShortcuts,
  standardShortcuts = ALL_SHORTCUTS,
  title = "Keyboard Shortcuts",
}: KeyboardShortcutsHelpProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus trap: restore focus to panel
  useEffect(() => {
    if (open) {
      setTimeout(() => panelRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const groups = buildShortcutGroups(standardShortcuts, appShortcuts);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-subtle)]",
          "bg-[var(--bg-secondary)]/95 backdrop-blur-xl shadow-2xl shadow-black/50",
          "animate-in fade-in zoom-in-95 duration-150",
          "outline-none",
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Keyboard className="h-4 w-4 text-[var(--text-tertiary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Shortcuts list ── */}
        <div className="overflow-y-auto p-4 max-h-[60vh] space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys + shortcut.description}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
                  >
                    <span className="text-[var(--text-secondary)]">{shortcut.description}</span>
                    <kbd className="ml-4 shrink-0 rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-2 py-0.5 font-mono text-[11px] text-[var(--text-primary)]">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer hints ── */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-1 font-mono">Esc</kbd>
            <span>Close</span>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            Press <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-1 font-mono">⌘⇧/</kbd> anytime
          </p>
        </div>
      </div>
    </div>
  );
}
