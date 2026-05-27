"use client";

/**
 * WorkspaceSwitcher
 * -----------------
 * Dropdown at the top of the sidebar to toggle active workspace context.
 * Shows the current workspace name and provides a menu to switch.
 */

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2, User, Check } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workspace } from "@/lib/schemas";

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (workspaces.length === 0) return null;

  const handleSelect = (workspace: Workspace) => {
    setActiveWorkspace(workspace.id);
    setOpen(false);
  };

  if (collapsed) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-center rounded-md p-2 text-white/50 transition-colors hover:bg-glass-05 hover:text-white"
          title={activeWorkspace?.name || "Switch workspace"}
        >
          <Building2 className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-white/10 bg-elevated py-1 shadow-xl">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSelect(ws)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-glass-05 hover:text-white"
              >
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{ws.name}</span>
                {ws.id === activeWorkspaceId && (
                  <Check className="ml-auto h-3.5 w-3.5 text-cyan-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-glass-05 hover:text-white"
      >
        <Building2 className="h-4 w-4 flex-shrink-0 text-cyan-400" />
        <span className="flex-1 truncate text-left font-medium">
          {activeWorkspace?.name || "Select workspace"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-white/30 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-white/10 bg-elevated py-1 shadow-xl">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-glass-05 hover:text-white"
            >
              {ws.name === "Personal" ? (
                <User className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span className="truncate">{ws.name}</span>
              {ws.id === activeWorkspaceId && (
                <Check className="ml-auto h-3.5 w-3.5 text-cyan-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
