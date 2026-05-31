"use client";

/**
 * AdminMobileHelpButton
 * ----------------------
 * Small keyboard icon button for the mobile bottom navigation bar.
 * Opens the keyboard shortcuts help dialog on tap.
 * Has its own state since the layout is a server component.
 */

import { useState } from "react";
import { Keyboard } from "lucide-react";
import { KeyboardShortcutsHelp } from "@syntaxure/ui";

export function AdminMobileHelpButton() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setHelpOpen(true)}
        className="flex flex-col items-center justify-center gap-1 rounded-md p-2 text-white/40 hover:text-white transition-colors min-w-[60px]"
        title="Keyboard Shortcuts (⌘⇧/)"
      >
        <Keyboard className="h-5 w-5" />
        <span className="text-[10px] font-medium">Help</span>
      </button>

      <KeyboardShortcutsHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Admin Shortcuts"
      />
    </>
  );
}
