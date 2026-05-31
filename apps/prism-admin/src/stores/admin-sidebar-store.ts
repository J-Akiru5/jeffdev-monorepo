"use client";

/**
 * Admin Sidebar Store
 * -------------------
 * Controls which set of navigation items are shown in the Admin sidebar.
 * Mode can be "manage" (Prism Engine / Products / Manage) or "agency"
 * (Agency projects, quotes, invoices, etc). Persisted to localStorage.
 */

import { create } from "zustand";
import { toast } from "sonner";

const STORAGE_KEY = "admin-sidebar-mode";

export type AdminSidebarMode = "manage" | "agency";

function getInitialMode(): AdminSidebarMode {
  if (typeof window === "undefined") return "manage";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "manage" || stored === "agency") return stored;
  return "manage";
}

interface AdminSidebarState {
  mode: AdminSidebarMode;
  setMode: (mode: AdminSidebarMode) => void;
  toggleMode: () => void;
}

export const useAdminSidebarStore = create<AdminSidebarState>((set, get) => ({
  mode: getInitialMode(),
  setMode: (mode) => {
    const prev = get().mode;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, mode);
    }
    set({ mode });
    toast.success(`Switched to ${mode === "manage" ? "Manage" : "Agency"} mode`);
    // Fire audit asynchronously (never blocks the UI)
    import("@/lib/audit").then(({ logAuditEvent }) => {
      logAuditEvent({
        action: "STATUS_CHANGE" as const,
        resource: "users" as const,
        resourceId: mode,
        details: { previous: prev, current: mode, change: "mode_toggle" },
      });
    });
  },
  toggleMode: () => {
    const prev = get().mode;
    const next = prev === "manage" ? "agency" : "manage";
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
    }
    set({ mode: next });
    toast.success(`Switched to ${next === "manage" ? "Manage" : "Agency"} mode`);
    // Fire audit asynchronously (never blocks the UI)
    import("@/lib/audit").then(({ logAuditEvent }) => {
      logAuditEvent({
        action: "STATUS_CHANGE" as const,
        resource: "users" as const,
        resourceId: next,
        details: { previous: prev, current: next, change: "mode_toggle" },
      });
    });
  },
}));
