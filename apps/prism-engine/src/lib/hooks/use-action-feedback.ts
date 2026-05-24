"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Generic action state — any server action returning `{ success?, error? }`.
 * Field-level errors (Record) are shown inline in forms; this hook only toasts
 * for general string errors and for success confirmations.
 */
type ActionState =
  | {
      success?: boolean;
      error?: string | Record<string, unknown>;
    }
  | null
  | undefined;

interface ActionFeedbackOptions {
  /** Message shown on success (default: "Done!") */
  successMessage?: string;
  /** Message shown when error is an object (field errors) rather than a string */
  fallbackErrorMessage?: string;
}

/**
 * `useActionFeedback`
 *
 * Fires sonner toasts in response to server action state transitions.
 * - Field-level validation errors (object) are **not** toasted — they show inline.
 * - String errors (server / general) are toasted as `toast.error()`.
 * - `success: true` transitions trigger `toast.success()`.
 *
 * @example
 * ```tsx
 * const [state, formAction] = useActionState(updateProject, null);
 * useActionFeedback(state, { successMessage: "Project updated!" });
 * ```
 */
export function useActionFeedback(
  state: ActionState,
  options: ActionFeedbackOptions = {},
) {
  const { successMessage = "Done!", fallbackErrorMessage } = options;
  // Track the previous state so we only toast on actual transitions
  const prev = useRef(state);

  useEffect(() => {
    if (!state) return;

    const was = prev.current;
    prev.current = state;

    // Avoid firing on initial render if state starts truthy
    if (!was && !state.success && !state.error) return;

    // Success transition
    if (state.success && !was?.success) {
      toast.success(successMessage);
      return;
    }

    // Error — only toast for string errors (field errors are shown inline)
    if (state.error && typeof state.error === "string" && state.error !== was?.error) {
      toast.error(state.error);
      return;
    }

    // Object error with a fallback message (e.g. "Please check the form")
    if (
      state.error &&
      typeof state.error === "object" &&
      fallbackErrorMessage &&
      JSON.stringify(state.error) !== JSON.stringify(was?.error)
    ) {
      toast.error(fallbackErrorMessage);
    }
  }, [state?.success, state?.error, successMessage, fallbackErrorMessage]);
}
