"use client";

/**
 * Keyboard Shortcuts
 * ------------------
 * Shared keyboard shortcut definitions for all Syntaxure apps.
 *
 * Each app wraps the `KeyboardShortcutsProvider` and registers callbacks
 * for the shortcuts it supports. The provider handles the global keydown
 * listener and prevents default browser behaviour.
 *
 * @example
 * // In your layout / shell:
 * <KeyboardShortcutsProvider
 *   onSearch={openCommandPalette}
 *   onToggleSidebar={toggleSidebar}
 *   onCommandPalette={openCommandPalette}
 * >
 *   {children}
 * </KeyboardShortcutsProvider>
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KeyboardShortcutDef {
  /** Keyboard key (lowercase, e.g. "k", "b", "/") */
  key: string;
  /** Whether the meta (⌘ on Mac / ⊞ on Windows) key is required */
  meta?: boolean;
  /** Whether the Ctrl key is required */
  ctrl?: boolean;
  /** Whether the Shift key is required */
  shift?: boolean;
  /** Whether the Alt key is required */
  alt?: boolean;
  /** Human-readable description (e.g. "Toggle sidebar") */
  description: string;
}

// ─── Named Shortcuts ─────────────────────────────────────────────────────────

export const SHORTCUT_SEARCH: KeyboardShortcutDef = {
  key: "k",
  meta: true,
  description: "Search / navigate",
};

export const SHORTCUT_SIDEBAR: KeyboardShortcutDef = {
  key: "b",
  meta: true,
  description: "Toggle sidebar",
};

export const SHORTCUT_COMMAND_PALETTE: KeyboardShortcutDef = {
  key: "/",
  meta: true,
  description: "Command palette",
};

export const SHORTCUT_HELP: KeyboardShortcutDef = {
  key: "/",
  meta: true,
  shift: true,
  description: "Keyboard shortcuts help",
};

export const SHORTCUT_TOGGLE_MODE: KeyboardShortcutDef = {
  key: "m",
  meta: true,
  shift: true,
  description: "Toggle sidebar mode",
};

/** All standard shortcuts, in registration order (first-match wins) */
export const ALL_SHORTCUTS: KeyboardShortcutDef[] = [
  SHORTCUT_SEARCH,
  SHORTCUT_SIDEBAR,
  SHORTCUT_COMMAND_PALETTE,
  SHORTCUT_HELP,
  SHORTCUT_TOGGLE_MODE,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Return a platform-aware display string for a shortcut definition.
 * On Mac:  ⌘K, ⌘B, ⌘/
 * On Windows / Linux:  Ctrl+K, Ctrl+B, Ctrl+/
 */
export function getShortcutLabel(shortcut: KeyboardShortcutDef): string {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");

  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    if (isMac && shortcut.meta) {
      parts.push("\u2318"); // ⌘
    } else if (shortcut.ctrl) {
      parts.push("Ctrl");
    } else if (shortcut.meta) {
      // Non-Mac platform with meta — fall back to Ctrl label
      parts.push("Ctrl");
    }
  }
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.alt) parts.push("Alt");

  parts.push(shortcut.key.toUpperCase());

  return parts.join("+");
}

/**
 * Test whether a KeyboardEvent matches a given shortcut definition.
 * Respects both metaKey and ctrlKey if either is flagged.
 */
export function matchesShortcut(
  e: KeyboardEvent,
  shortcut: KeyboardShortcutDef,
): boolean {
  if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) return false;

  const {
    meta = false,
    ctrl = false,
    shift = false,
    alt = false,
  } = shortcut;

  const wantsMod = meta || ctrl;
  const hasMod = e.metaKey || e.ctrlKey;

  if (wantsMod && !hasMod) return false;
  if (!wantsMod && hasMod) return false;
  if (shift && !e.shiftKey) return false;
  if (!shift && e.shiftKey) return false;
  if (alt && !e.altKey) return false;
  if (!alt && e.altKey) return false;

  return true;
}
