"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@syntaxure/ui";
import { useProjects } from "@/contexts/project-context";
import { logAuditEvent } from "@/lib/audit";

interface SidebarProjectItemProps {
  project: {
    id: string;
    name: string;
    color?: string;
  };
  active: boolean;
  collapsed: boolean;
  editing: boolean;
  editName: string;
  onEditNameChange: (name: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSelect: () => void;
}

export function SidebarProjectItem({
  project,
  active,
  collapsed,
  editing,
  editName,
  onEditNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSelect,
}: SidebarProjectItemProps) {
  const { removeProject } = useProjects();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    removeProject(project.id);
    logAuditEvent({
      action: "DELETE",
      resource: "projects",
      resourceId: project.id,
      details: { name: project.name },
    });
    setShowDeleteDialog(false);
  };

  if (editing && !collapsed) {
    return (
      <li className="group relative px-1">
        <div className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-2 py-1">
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
            className="flex-1 bg-transparent text-sm text-white outline-none"
          />
          <button
            onClick={onSaveEdit}
            className="rounded p-0.5 text-emerald-400 hover:text-emerald-300"
          >
            <span className="sr-only">Save</span>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <button
            onClick={onCancelEdit}
            className="rounded p-0.5 text-white/40 hover:text-white/70"
          >
            <span className="sr-only">Cancel</span>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </li>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`Delete "${project.name}"?`}
        description="Tasks in this list won't be deleted."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
      <li className="group relative">
      <button
        onClick={onSelect}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
          active
            ? "bg-cyan-500/10 text-white"
            : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
        } ${collapsed ? "justify-center" : ""}`}
        title={collapsed ? project.name : undefined}
      >
        <span
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: project.color || "var(--color-cyan)" }}
        />
        {!collapsed && (
          <span className="flex-1 truncate text-left">{project.name}</span>
        )}
        {!collapsed && (
          <div
            className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onStartEdit}
              className="rounded p-0.5 text-white/40 hover:text-white/70"
              title="Rename"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="rounded p-0.5 text-white/40 hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </button>
    </li>
    </>
  );
}
