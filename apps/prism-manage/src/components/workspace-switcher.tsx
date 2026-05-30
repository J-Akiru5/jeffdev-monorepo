"use client";

import { useState, useRef, useEffect } from "react";
import { Building2, Check, ChevronDown, User } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (workspaces.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
        <span className="max-w-[120px] truncate font-medium">
          {active?.name || "Workspace"}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-white/10 bg-[#0a0a0a]/95 py-1 shadow-2xl backdrop-blur-xl">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                {ws.name === "Personal" ? (
                  <User className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Building2 className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                )}
                <span className="flex-1 truncate text-left">{ws.name}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-cyan-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
