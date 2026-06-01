"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@syntaxure/ui";
import { uploadToStorage } from "@/app/actions/storage";
import { createAgencyProject, updateAgencyProject } from "@/app/actions/agency-projects";
import type { ProjectFormData } from "@/app/actions/agency-projects";
import type { UserProfile } from "@/app/actions/agency-users";

/**
 * Project Form Component
 * -----------------------
 * Form for creating and editing agency projects.
 */

interface Props {
  mode: "create" | "edit";
  defaultValues?: Partial<ProjectFormData>;
  users?: UserProfile[];
}

export function ProjectForm({ mode, defaultValues, users }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    slug: defaultValues?.slug || "",
    title: defaultValues?.title || "",
    userId: defaultValues?.userId || "",
    client: defaultValues?.client || "",
    clientEmail: defaultValues?.clientEmail || "",
    category: defaultValues?.category || "",
    tagline: defaultValues?.tagline || "",
    description: defaultValues?.description || "",
    status: defaultValues?.status || "active" as const,
    progress: defaultValues?.progress ?? 0,
    startDate: defaultValues?.startDate || "",
    deadline: defaultValues?.deadline || "",
    budget: defaultValues?.budget ?? undefined,
    published: defaultValues?.published || false,
    image: defaultValues?.image || null,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = {
      ...form,
      challenge: defaultValues?.challenge || "",
      solution: defaultValues?.solution || "",
      results: defaultValues?.results || [],
      technologies: defaultValues?.technologies || [],
      testimonial: defaultValues?.testimonial || null,
      image: form.image || null,
      featured: defaultValues?.featured || false,
      published: form.published,
      order: defaultValues?.order || 0,
      paidAmount: defaultValues?.paidAmount,
      assignedPartner: defaultValues?.assignedPartner || "",
      assignedEmployees: defaultValues?.assignedEmployees || [],
    };

    const result =
      mode === "edit" && defaultValues?.slug
        ? await updateAgencyProject(defaultValues.slug, data)
        : await createAgencyProject(data);

    if (result.success) {
      router.push("/admin/agency/projects");
      router.refresh();
    } else {
      setError(result.error || "Operation failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Basic Info</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 font-mono"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Tagline</label>
          <input
            value={form.tagline}
            onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            required
          />
        </div>
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Client</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-white/50 mb-1">Link Client Profile</label>
            <select
              value={form.userId}
              onChange={(e) => {
                const selectedUid = e.target.value;
                const found = users?.find(u => u.uid === selectedUid);
                setForm((f) => ({
                  ...f,
                  userId: selectedUid,
                  client: found ? found.displayName : f.client,
                  clientEmail: found ? found.email : f.clientEmail,
                }));
              }}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              required
            >
              <option value="">-- Choose Client Profile --</option>
              {users?.map(u => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName} ({u.email}) - {u.role}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-white/30 mt-1">
              Select an existing client to auto-populate their details and link their UUID.
            </p>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Client Name</label>
            <input
              value={form.client}
              onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Client Email</label>
            <input
              type="email"
              value={form.clientEmail}
              onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white/80">Project Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectFormData["status"] }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Budget ($)</label>
            <input
              type="number"
              value={form.budget ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <input
            type="checkbox"
            id="projectPublished"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            className="h-4 w-4 rounded border-white/10 bg-white/5 text-cyan-600 focus:ring-cyan-500/50"
          />
          <div>
            <label htmlFor="projectPublished" className="block text-sm font-medium text-white/80">
              Publish to Portfolio
            </label>
            <p className="text-xs text-white/40 mt-0.5">
              If enabled, this project will be listed publicly on the main Syntaxure Labs `/work` page.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-sm font-medium text-white/80">Cover Image</h3>
          <ImageUpload
            currentImage={form.image}
            onUpload={async (file) => {
              const result = await uploadToStorage(file, "projects");
              if (result.success && result.url) {
                setForm((f) => ({ ...f, image: result.url! }));
                return { url: result.url };
              }
              return { url: "", error: result.error };
            }}
            onRemove={async () => {
              setForm((f) => ({ ...f, image: null }));
              return { success: true };
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white/10 px-6 py-2.5 text-sm text-white hover:bg-white/15 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : mode === "edit" ? "Update Project" : "Create Project"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2.5 text-sm text-white/40 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
