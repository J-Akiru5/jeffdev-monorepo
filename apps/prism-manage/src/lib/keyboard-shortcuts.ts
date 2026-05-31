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
  { key: "k", meta: true, description: "Command Palette", action: "command-palette" },
  { key: "k", ctrl: true, description: "Command Palette", action: "command-palette" },
  { key: "n", meta: true, description: "New Task", action: "new-task" },
  { key: "n", ctrl: true, description: "New Task", action: "new-task" },
  { key: "/", meta: true, description: "Toggle Sidebar", action: "toggle-sidebar" },
  { key: "/", ctrl: true, description: "Toggle Sidebar", action: "toggle-sidebar" },
  { key: "1", meta: true, description: "Dashboard", action: "go-dashboard" },
  { key: "1", ctrl: true, description: "Dashboard", action: "go-dashboard" },
  { key: "2", meta: true, description: "Tasks", action: "go-tasks" },
  { key: "2", ctrl: true, description: "Tasks", action: "go-tasks" },
  { key: "3", meta: true, description: "Calendar", action: "go-calendar" },
  { key: "3", ctrl: true, description: "Calendar", action: "go-calendar" },
  { key: "4", meta: true, description: "Kanban", action: "go-kanban" },
  { key: "4", ctrl: true, description: "Kanban", action: "go-kanban" },
];

export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");
  const mod = isMac ? "\u2318" : "Ctrl";
  const parts = [mod];
  if (shortcut.shift) parts.push("Shift");
  parts.push(shortcut.key.toUpperCase());
  return parts.join("+");
}
