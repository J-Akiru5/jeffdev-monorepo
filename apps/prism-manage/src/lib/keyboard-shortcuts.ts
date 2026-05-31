"use client";

/**
 * Keyboard Shortcuts
 * ------------------
 * Global keyboard shortcut definitions for prism-manage.
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: "n", meta: true, description: "New Task", action: "new-task" },
  { key: "n", ctrl: true, description: "New Task", action: "new-task" },
  { key: "1", meta: true, description: "Dashboard", action: "go-dashboard" },
  { key: "1", ctrl: true, description: "Dashboard", action: "go-dashboard" },
  { key: "2", meta: true, description: "Tasks", action: "go-tasks" },
  { key: "2", ctrl: true, description: "Tasks", action: "go-tasks" },
  { key: "3", meta: true, description: "Calendar", action: "go-calendar" },
  { key: "3", ctrl: true, description: "Calendar", action: "go-calendar" },
  { key: "4", meta: true, description: "Kanban", action: "go-kanban" },
  { key: "4", ctrl: true, description: "Kanban", action: "go-kanban" },
];

import type { ShortcutsHelpShortcut } from "@syntaxure/ui";

/**
 * App-specific shortcuts shown in the keyboard shortcuts help dialog.
 * Shared between the desktop TopNavbar and the mobile MobileNav.
 */
export const MANAGE_HELP_SHORTCUTS: ShortcutsHelpShortcut[] = [
  { key: "n", meta: true, ctrl: true, description: "New Task", category: "Manage" },
  { key: "1", meta: true, ctrl: true, description: "Go to Dashboard", category: "Manage" },
  { key: "2", meta: true, ctrl: true, description: "Go to Tasks", category: "Manage" },
  { key: "3", meta: true, ctrl: true, description: "Go to Calendar", category: "Manage" },
  { key: "4", meta: true, ctrl: true, description: "Go to Kanban", category: "Manage" },
];

export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");
  const mod = isMac ? "\u2318" : "Ctrl";
  const parts = [mod];
  if (shortcut.shift) parts.push("Shift");
  parts.push(shortcut.key.toUpperCase());
  return parts.join("+");
}
