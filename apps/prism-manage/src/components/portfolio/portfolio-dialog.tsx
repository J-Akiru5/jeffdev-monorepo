"use client";

/**
 * PortfolioDialog
 * ---------------
 * Modal shell shared by the portfolio create/edit dialogs. Backdrop click and
 * Escape close it; the body scrolls independently so long forms stay usable on
 * a phone. Mirrors the PromptDialog styling used elsewhere in the app.
 */

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

export type PortfolioDialogSize = keyof typeof SIZES;

interface PortfolioDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: PortfolioDialogSize;
  children: ReactNode;
  footer?: ReactNode;
}

export function PortfolioDialog({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: PortfolioDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 my-8 w-full ${SIZES[size]} rounded-xl border border-border bg-[#0a0a0a] shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-white/40">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded p-1 text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
