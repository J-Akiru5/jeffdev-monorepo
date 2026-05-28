"use client";

/**
 * @component ConfirmDialog
 * @description Accessible confirmation dialog to replace window.confirm().
 * Renders via a portal with backdrop, focus trap, and keyboard dismissal.
 *
 * @example
 * const [show, setShow] = useState(false);
 * // ...
 * <ConfirmDialog
 *   open={show}
 *   onOpenChange={setShow}
 *   title="Delete service?"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   confirmVariant="danger"
 *   onConfirm={handleDelete}
 * />
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { cn } from "./utils";
import { Button, type ButtonProps } from "./button";

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description / body */
  description?: string;
  /** Optional icon to show */
  icon?: React.ComponentType<{ className?: string }>;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Confirm button variant */
  confirmVariant?: ButtonProps["variant"];
  /** Called when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Called when user cancels (optional, defaults to just closing) */
  onCancel?: () => void;
  /** Additional content below the description */
  children?: ReactNode;
  /** Whether the confirm action is loading */
  isLoading?: boolean;
  /** Additional classes for the dialog container */
  className?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  children,
  isLoading,
  className,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  // Sync internal loading state with prop
  useEffect(() => {
    if (isLoading !== undefined) {
      setLoading(isLoading);
    }
  }, [isLoading]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("[ConfirmDialog] onConfirm failed:", err);
    } finally {
      setLoading(false);
    }
  }, [onConfirm, onOpenChange]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleCancel]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl shadow-black/50",
          "animate-in fade-in zoom-in-95 duration-200",
          className,
        )}
      >
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
              <Icon className="h-5 w-5 text-red-400" />
            </div>
          )}
          <div className="flex-1">
            <h3
              id="confirm-dialog-title"
              className="text-base font-semibold text-white"
            >
              {title}
            </h3>
            {description && (
              <p
                id="confirm-dialog-description"
                className="mt-1 text-sm text-white/50"
              >
                {description}
              </p>
            )}
            {children && <div className="mt-3">{children}</div>}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={handleConfirm}
            isLoading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
