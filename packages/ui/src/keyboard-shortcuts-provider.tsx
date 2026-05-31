"use client";

/**
 * KeyboardShortcutsProvider
 * --------------------------
 * Global keyboard shortcut handler for all Syntaxure apps.
 *
 * Wraps your layout and fires callbacks when the registered shortcuts are
 * pressed. This is the **only** place in each app that registers the global
 * keydown listener — components should never duplicate this.
 *
 * Shortcuts registered:
 *   ⌘K  → onSearch          (meta/ctrl + k)
 *   ⌘B  → onToggleSidebar   (meta/ctrl + b)
 *   ⌘/  → onCommandPalette  (meta/ctrl + /)
 *
 * All three callbacks are optional. Omit any you don't need.
 *
 * @example
 * <KeyboardShortcutsProvider
 *   onSearch={() => setPaletteOpen(true)}
 *   onCommandPalette={() => setPaletteOpen(true)}
 * >
 *   {children}
 * </KeyboardShortcutsProvider>
 */

import { useEffect, type ReactNode } from "react";
import {
  SHORTCUT_SEARCH,
  SHORTCUT_SIDEBAR,
  SHORTCUT_COMMAND_PALETTE,
  SHORTCUT_HELP,
  SHORTCUT_TOGGLE_MODE,
  matchesShortcut,
} from "./keyboard-shortcuts";

interface KeyboardShortcutsProviderProps {
  children: ReactNode;

  /** Called when ⌘K is pressed — typically opens search / command palette */
  onSearch?: () => void;

  /** Called when ⌘B is pressed — typically toggles the sidebar */
  onToggleSidebar?: () => void;

  /** Called when ⌘/ is pressed — typically opens the command palette */
  onCommandPalette?: () => void;

  /** Called when ⌘⇧/ is pressed — typically opens keyboard shortcuts help */
  onShowHelp?: () => void;

  /** Called when ⌘⇧M is pressed — typically toggles sidebar mode (manage/agency) */
  onToggleMode?: () => void;
}

export function KeyboardShortcutsProvider({
  children,
  onSearch,
  onToggleSidebar,
  onCommandPalette,
  onShowHelp,
  onToggleMode,
}: KeyboardShortcutsProviderProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if the user is typing in an input / textarea / contenteditable
      const target = e.target as HTMLElement;
      const isEditable =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      if (isEditable) return;

      // ⌘K → Search / command palette
      if (matchesShortcut(e, SHORTCUT_SEARCH) && onSearch) {
        e.preventDefault();
        onSearch();
        return;
      }

      // ⌘B → Toggle sidebar
      if (matchesShortcut(e, SHORTCUT_SIDEBAR) && onToggleSidebar) {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // ⌘/ → Command palette
      if (matchesShortcut(e, SHORTCUT_COMMAND_PALETTE) && onCommandPalette) {
        e.preventDefault();
        onCommandPalette();
        return;
      }

      // ⌘⇧/ → Keyboard shortcuts help
      if (matchesShortcut(e, SHORTCUT_HELP) && onShowHelp) {
        e.preventDefault();
        onShowHelp();
        return;
      }

      // ⌘⇧M → Toggle sidebar mode
      if (matchesShortcut(e, SHORTCUT_TOGGLE_MODE) && onToggleMode) {
        e.preventDefault();
        onToggleMode();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSearch, onToggleSidebar, onCommandPalette, onShowHelp, onToggleMode]);

  return <>{children}</>;
}
