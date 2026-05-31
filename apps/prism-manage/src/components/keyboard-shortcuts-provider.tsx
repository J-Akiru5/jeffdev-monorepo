"use client";

/**
 * Keyboard Shortcuts Provider
 * ---------------------------
 * Registers global keyboard shortcuts and dispatches navigation actions.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { KEYBOARD_SHORTCUTS } from "@/lib/keyboard-shortcuts";

export function KeyboardShortcutsProvider({
  children,
  onCommandPaletteToggle,
}: {
  children: React.ReactNode;
  onCommandPaletteToggle?: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;

      for (const shortcut of KEYBOARD_SHORTCUTS) {
        const matchesKey = e.key.toLowerCase() === shortcut.key;
        const matchesMod = shortcut.meta || shortcut.ctrl ? isMeta : true;
        const matchesShift = shortcut.shift ? e.shiftKey : true;

        if (matchesKey && matchesMod && matchesShift) {
          e.preventDefault();

          switch (shortcut.action) {
            case "command-palette":
              onCommandPaletteToggle?.();
              break;
            case "new-task":
              router.push("/tasks/new");
              break;
            case "toggle-sidebar":
              document.dispatchEvent(new CustomEvent("toggle-sidebar"));
              break;
            case "go-dashboard":
              router.push("/dashboard");
              break;
            case "go-tasks":
              router.push("/tasks");
              break;
            case "go-calendar":
              router.push("/calendar");
              break;
            case "go-kanban":
              router.push("/kanban");
              break;
          }
          break;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, onCommandPaletteToggle]);

  return <>{children}</>;
}
