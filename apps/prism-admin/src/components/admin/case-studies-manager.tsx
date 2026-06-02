"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  type CaseStudyInput,
} from "@/app/actions/case-studies";

interface CaseStudy {
  id: string;
  title: string;
  slug: string | null;
  description?: string | null;
  status: string;
}

interface Props {
  initialData: CaseStudy[];
}

const emptyForm: CaseStudyInput = {
  title: "",
  slug: "",
  description: null,
  status: "draft",
};

export function CaseStudiesManager({ initialData }: Props) {
  const [items, setItems] = useState<CaseStudy[]>(initialData);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [form, setForm] = useState<CaseStudyInput>(emptyForm);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(item: CaseStudy) {
    setEditing(item);
    setForm({
      title: item.title,
      slug: item.slug ?? "",
      description: item.description ?? null,
      status: item.status as "draft" | "published",
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const result = editing
      ? await updateCaseStudy(editing.id, form)
      : await createCaseStudy(form);

    if (result.success) {
      setMessage({ type: "success", text: editing ? "Case study updated" : "Case study created" });
      resetForm();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to save" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this case study?")) return;
    const result = await deleteCaseStudy(id);
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setMessage({ type: "success", text: "Case study deleted" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to delete" });
    }
  }

  async function handleToggleStatus(item: CaseStudy) {
    const newStatus = item.status === "published" ? "draft" : "published";
    const result = await updateCaseStudy(item.id, { status: newStatus });
    if (result.success) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)),
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Case Studies</h1>
          <p className="mt-1 text-sm text-white/50">{items.length} total</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Case Study"}
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

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {editing ? "Edit Case Study" : "New Case Study"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Description</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
              rows={3}
              className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input
                type="checkbox"
                checked={form.status === "published"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.checked ? "published" : "draft" }))
                }
                className="rounded border-white/20 bg-white/5"
              />
              Published
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
            >
              {editing ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-white/30">
            No case studies yet
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                  {item.description && (
                    <p className="mt-2 text-xs text-white/40 line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${
                        item.status === "published"
                          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          : "bg-white/10 text-white/40 hover:bg-white/20"
                      }`}
                    >
                      {item.status || "draft"}
                    </button>
                    {item.slug && (
                      <span className="text-[10px] text-white/30 font-mono">{item.slug}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(item)}
                    className="rounded p-1.5 text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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
