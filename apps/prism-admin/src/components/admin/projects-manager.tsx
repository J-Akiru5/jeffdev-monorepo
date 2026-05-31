"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ListTodo } from "lucide-react";
import {
  adminCreateProject,
  adminUpdateProject,
  adminDeleteProject,
} from "@/app/actions/manage";
import { getWorkspaces } from "@/app/actions/manage";

interface Project {
  id: string;
  name: string;
  color?: string;
  workspaceName: string;
  workspaceId: string;
  taskCount: number;
  completedCount: number;
  createdAt: string;
  published: boolean;
  publishedSiteUrl?: string | null;
}

interface Workspace {
  id: string;
  name: string;
}

interface Props {
  initialProjects: Project[];
}

const COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

export function ProjectsManager({ initialProjects }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editPublished, setEditPublished] = useState(false);
  const [editPublishedSiteUrl, setEditPublishedSiteUrl] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // New project form
  const [newName, setNewName] = useState("");
  const [newWorkspaceId, setNewWorkspaceId] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  async function openNewForm() {
    setEditingId(null);
    setNewName("");
    setNewColor(COLORS[0]);
    setShowForm(true);
    const ws = await getWorkspaces();
    setWorkspaces(ws.map((w) => ({ id: w.id, name: w.name })));
    setNewWorkspaceId(ws[0]?.id ?? "");
  }

  function startEdit(p: Project) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditColor(p.color ?? COLORS[0]!);
    setEditPublished(p.published ?? false);
    setEditPublishedSiteUrl(p.publishedSiteUrl ?? "");
    setShowForm(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newWorkspaceId) return;

    const result = await adminCreateProject({
      name: newName.trim(),
      workspaceId: newWorkspaceId,
      color: newColor,
    });

    if (result.success) {
      setMessage({ type: "success", text: "Project created" });
      setShowForm(false);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to create" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleUpdate() {
    if (!editingId || !editName.trim()) return;

    const result = await adminUpdateProject(editingId, {
      name: editName.trim(),
      color: editColor,
      published: editPublished,
      publishedSiteUrl: editPublished ? editPublishedSiteUrl || null : null,
    });

    if (result.success) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: editName.trim(),
                color: editColor,
                published: editPublished,
                publishedSiteUrl: editPublished ? editPublishedSiteUrl || null : null,
              }
            : p,
        ),
      );
      setMessage({ type: "success", text: "Project updated" });
      setShowForm(false);
      setEditingId(null);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its tasks?`)) return;
    const result = await adminDeleteProject(id);

    if (result.success) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setMessage({ type: "success", text: `"${name}" deleted` });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to delete" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">All Projects</h1>
          <p className="text-sm text-white/50">
            {projects.length} projects across all workspaces
          </p>
        </div>
        <button
          onClick={openNewForm}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* New/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {editingId ? "Edit Project" : "New Project"}
          </h3>

          {editingId ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        editColor === c ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Published Toggle */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Visibility</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditPublished((v) => !v)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      editPublished ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        editPublished ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                  <span className="text-sm text-white/60">
                    {editPublished
                      ? "Published — visible on Syntaxure Labs"
                      : "Draft — hidden from public"}
                  </span>
                </div>
              </div>

              {/* Published Site URL — only when published */}
              {editPublished && (
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">
                    Published Site URL
                  </label>
                  <input
                    type="url"
                    value={editPublishedSiteUrl}
                    onChange={(e) => setEditPublishedSiteUrl(e.target.value)}
                    placeholder="https://clientsite.com"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2
                               text-sm text-white placeholder:text-white/20 font-mono
                               focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <p className="mt-1 text-xs text-white/30">
                    The live URL of the delivered product. Shown as a CTA on the case study page.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleUpdate}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
                  placeholder="Project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Workspace</label>
                <select
                  value={newWorkspaceId}
                  onChange={(e) => setNewWorkspaceId(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                  required
                >
                  <option value="">Select workspace</option>
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        newColor === c ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Projects List */}
      <div className="grid gap-3">
        {projects.length === 0 ? (
          <div className="py-12 text-center text-white/30">No projects found</div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              className="group rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.color || "#6366f1" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-white">{p.name}</h3>
                    <span className="text-[10px] text-white/30 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                      {p.workspaceName}
                    </span>
                    {p.published && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase
                                       bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        live
                      </span>
                    )}
                    {p.publishedSiteUrl && (
                      <a
                        href={p.publishedSiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-mono text-emerald-400/60 hover:text-emerald-400
                                   underline underline-offset-2 transition-colors"
                      >
                        {p.publishedSiteUrl.replace(/^https?:\/\//, "").split("/")[0]}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <ListTodo className="h-3 w-3" />
                      {p.taskCount} tasks
                    </span>
                    {p.taskCount > 0 && (
                      <span>
                        {Math.round((p.completedCount / p.taskCount) * 100)}% complete
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded p-1.5 text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="rounded p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
