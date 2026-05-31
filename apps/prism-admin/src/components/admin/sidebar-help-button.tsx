"use client";

/**
 * AdminSidebarHelpButton
 * -----------------------
 * Keyboard icon button for the desktop sidebar footer.
 * Opens the keyboard shortcuts help dialog on click.
 * Has its own state since the layout is a server component.
 */

import { useState } from "react";
import { Keyboard } from "lucide-react";
import { KeyboardShortcutsHelp } from "@syntaxure/ui";

export function AdminSidebarHelpButton() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setHelpOpen(true)}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/5 hover:text-white/80"
        title="Keyboard Shortcuts (⌘⇧/)"
      >
        <Keyboard className="h-4 w-4 flex-shrink-0" />
        <span>Keyboard Shortcuts</span>
      </button>

      <KeyboardShortcutsHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Admin Shortcuts"
      />
    </>
  );
}
