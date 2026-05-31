"use client";

/**
 * Keyboard Shortcuts Provider (Manage-specific extras)
 * -----------------------------------------------------
 * Handles app-specific shortcuts NOT covered by the shared system:
 *   ⌘N → New Task
 *   ⌘1 → Dashboard, ⌘2 → Tasks, ⌘3 → Calendar, ⌘4 → Kanban
 *
 * The universal shortcuts (⌘K, ⌘B, ⌘/) are handled by the shared
 * KeyboardShortcutsProvider from @syntaxure/ui.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { KEYBOARD_SHORTCUTS } from "@/lib/keyboard-shortcuts";

export function ManageShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
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
            case "new-task":
              router.push("/tasks/new");
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
  }, [router]);

  return <>{children}</>;
}
