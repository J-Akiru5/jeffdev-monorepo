"use client";

/**
 * Manage Mode Store
 * -----------------
 * Zustand store for toggling between Focus and Workspace modes in the
 * Manage app. Persisted to localStorage key `manage-mode`.
 *
 * - `focus` (default): Task-focused — Views, Quick Actions, Lists
 * - `workspace`: Organization-focused — Departments, Projects, Marketing
 */

import { create } from "zustand";
import { toast } from "sonner";

export type ManageMode = "focus" | "workspace";

function getInitialMode(): ManageMode {
  if (typeof window === "undefined") return "focus";
  const stored = localStorage.getItem("manage-mode");
  if (stored === "focus" || stored === "workspace") return stored;
  return "focus";
}

interface ManageModeState {
  mode: ManageMode;
  setMode: (mode: ManageMode) => void;
  toggleMode: () => void;
}

export const useManageModeStore = create<ManageModeState>((set, get) => ({
  mode: getInitialMode(),

  setMode: (mode) => {
    const prev = get().mode;
    localStorage.setItem("manage-mode", mode);
    set({ mode });
    toast.success(`Switched to ${mode === "focus" ? "Focus" : "Workspace"} mode`);
    // Fire audit asynchronously (never blocks the UI)
    import("@/lib/audit").then(({ logAuditEvent }) => {
      logAuditEvent({
        action: "TOGGLE",
        resource: "manage_mode",
        resourceId: mode === "focus" ? "focus" : "workspace",
        details: { previous: prev, current: mode },
      });
    });
  },

  toggleMode: () => {
    const prev = get().mode;
    const next = prev === "focus" ? "workspace" : "focus";
    localStorage.setItem("manage-mode", next);
    set({ mode: next });
    toast.success(`Switched to ${next === "focus" ? "Focus" : "Workspace"} mode`);
    // Fire audit asynchronously (never blocks the UI)
    import("@/lib/audit").then(({ logAuditEvent }) => {
      logAuditEvent({
        action: "TOGGLE",
        resource: "manage_mode",
        resourceId: next,
        details: { previous: prev, current: next },
      });
    });
  },
}));