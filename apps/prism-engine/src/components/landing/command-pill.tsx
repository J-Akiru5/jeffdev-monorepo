"use client";

/**
 * CommandPill — the one-line install command with a copy affordance.
 *
 * Deliberately not `components/ui/code-block`: that renders a full highlighted
 * source block on its own dark background, which fights the hero. This is the
 * single-line "run this" affordance, in the house mono/mono-uppercase voice.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@syntaxure/ui";

interface CommandPillProps {
  command: string;
  className?: string;
}

export function CommandPill({ command, className }: CommandPillProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused (insecure origin, denied permission).
      // The command is already selectable text, so there is nothing to fix.
    }
  }, [command]);

  return (
    <div
      className={cn(
        "group relative inline-flex w-full max-w-md items-center gap-3 rounded-md border border-[var(--border-subtle)] bg-white/[0.02] py-3 pl-4 pr-2 backdrop-blur-sm transition-colors hover:border-[var(--border-active)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="select-none font-mono text-sm text-[var(--color-cyan)]"
      >
        $
      </span>
      <code className="flex-1 overflow-x-auto whitespace-nowrap text-left font-mono text-xs text-[var(--text-primary)] md:text-sm">
        {command}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Command copied" : `Copy command: ${command}`}
        className="shrink-0 rounded-sm border border-[var(--border-subtle)] p-2 text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-active)] hover:text-[var(--text-primary)] active:scale-95"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={1.5} />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Command copied to clipboard" : ""}
      </span>
    </div>
  );
}

export default CommandPill;
