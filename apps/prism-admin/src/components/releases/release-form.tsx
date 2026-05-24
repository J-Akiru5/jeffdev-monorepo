"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@syntaxure/ui";
import { Save, ArrowLeft, X, Plus } from "lucide-react";
import {
  createRelease,
  updateRelease,
  type ReleaseFormData,
} from "@/app/actions/releases";
import Link from "next/link";

interface FormState {
  title: string;
  version: string;
  date: string;
  type: "tool" | "update" | "patch";
  description: string;
  link: string;
  tags: string[];
  is_featured: boolean;
}

interface ReleaseFormProps {
  initialData?: FormState & { id: string };
  isEditing?: boolean;
}

const DEFAULT_FORM: FormState = {
  title: "",
  version: "",
  date: new Date().toISOString().split("T")[0] ?? "",
  type: "update",
  description: "",
  link: "",
  tags: [],
  is_featured: false,
};

function toFormState(
  data: ReleaseFormData & { id: string },
): FormState & { id: string } {
  return {
    id: data.id,
    title: data.title,
    version: data.version ?? "",
    date: data.date.split("T")[0] ?? data.date,
    type: data.type,
    description: data.description,
    link: data.link ?? "",
    tags: data.tags ?? [],
    is_featured: data.is_featured,
  };
}

function toPayload(form: FormState): ReleaseFormData {
  return {
    title: form.title,
    version: form.version || null,
    date: form.date,
    type: form.type,
    description: form.description,
    link: form.link || null,
    tags: form.tags.length > 0 ? form.tags : null,
    is_featured: form.is_featured,
  };
}

const releaseTypes = [
  {
    value: "tool",
    label: "Tool",
    description: "Major tool or product release",
  },
  {
    value: "update",
    label: "Update",
    description: "Feature update or improvement",
  },
  { value: "patch", label: "Patch", description: "Bug fix or minor change" },
] as const;

export function ReleaseForm({ initialData, isEditing }: ReleaseFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initialData ? toFormState(initialData) : DEFAULT_FORM,
  );
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload = toPayload(form);
      const id = initialData && isEditing ? initialData.id : undefined;

      const result = id
        ? await updateRelease(id, payload)
        : await createRelease(payload);

      if (result.success) {
        setMessage({
          type: "success",
          text: isEditing ? "Release updated." : "Release created.",
        });
        setTimeout(() => router.push("/admin/agency/releases"), 1000);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save." });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !form.tags?.includes(trimmed)) {
      setForm((prev) => ({ ...prev, tags: [...(prev.tags ?? []), trimmed] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) ?? [],
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/agency/releases"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Releases
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? "Edit Release" : "New Release"}
          </h1>
          <p className="text-sm text-white/50">
            {isEditing ? "Update release notes" : "Create a new release entry"}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving
            ? "Saving..."
            : isEditing
              ? "Update Release"
              : "Create Release"}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Basic Info */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Basic Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full"
              placeholder="e.g., Prism Context Engine"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Version
              </label>
              <Input
                value={form.version}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, version: e.target.value }))
                }
                className="w-full"
                placeholder="e.g., v2.4.0"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Date *
              </label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Type *
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as "tool" | "update" | "patch",
                  }))
                }
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              >
                {releaseTypes.map((t) => (
                  <option
                    key={t.value}
                    value={t.value}
                    className="bg-[#030303]"
                  >
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
              placeholder="Describe what's new in this release..."
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Link (optional)
            </label>
            <Input
              value={form.link}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, link: e.target.value }))
              }
              className="w-full"
              placeholder="https://prism.jeffdev.studio"
            />
          </div>
        </div>
      </section>

      {/* Tags */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Tags
        </h2>
        <div className="flex gap-2 mb-3">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            className="flex-1"
            placeholder="Type a tag and press Enter"
          />
          <button
            onClick={addTag}
            className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
        {form.tags && form.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30">No tags added yet.</p>
        )}
      </section>

      {/* Featured Toggle */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Visibility
        </h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_featured: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="h-6 w-11 rounded-full border border-white/10 bg-white/5 peer-checked:bg-amber-500/30 peer-checked:border-amber-500/50 transition-colors" />
            <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white/30 peer-checked:bg-amber-400 peer-checked:translate-x-5 transition-all shadow-sm" />
          </div>
          <div>
            <span className="text-sm text-white/80">Featured Release</span>
            <p className="text-xs text-white/40">
              Featured releases appear in the hero section of the community page
            </p>
          </div>
        </label>
      </section>

      {/* Bottom Save */}
      <div className="flex justify-end border-t border-white/5 pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving
            ? "Saving..."
            : isEditing
              ? "Update Release"
              : "Create Release"}
        </button>
      </div>
    </div>
  );
}
