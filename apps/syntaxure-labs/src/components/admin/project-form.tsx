"use client";

/**
 * Project Form Component
 * ----------------------
 * Shared form for creating and editing projects.
 * Includes client user association, budget, progress, team, metrics, and cover image.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Save, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ImageUpload } from "@syntaxure/ui";
import { uploadFile } from "@/app/actions/upload";
import { createProject, updateProject } from "@/app/actions/projects";
import type { FirestoreProject } from "@/types/supabase";
import type { UserProfile } from "@/types/user";

interface Metric {
  metric: string;
  value: string;
}

interface FormData {
  slug: string;
  title: string;
  userId: string;
  client: string;
  clientEmail: string;
  category: string;
  tagline: string;
  description: string;
  challenge: string;
  solution: string;
  results: Metric[];
  technologies: string[];
  testimonial: {
    quote: string;
    author: string;
    role: string;
  } | null;
  image: string | null;
  featured: boolean;
  order: number;
  status: "pending" | "active" | "paused" | "completed";
  progress: number;
  startDate: string;
  deadline: string;
  budget: number;
  paidAmount: number;
  assignedPartner: string;
  assignedEmployees: string[];
}

interface Props {
  mode: "create" | "edit";
  initialData?: FirestoreProject;
  users: UserProfile[];
}

const CATEGORIES = [
  "SaaS Platform",
  "Web Application",
  "E-Commerce",
  "Mobile App",
  "Internal Tool",
  "API / Backend",
  "Landing Page",
  "Other",
];

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
];

export function ProjectForm({ mode, initialData, users }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filter clients, partners, and employees from users list
  const clients = users.filter(
    (u) =>
      u.role === "employee" ||
      u.role === "partner" ||
      u.role === "admin" ||
      u.role === "founder",
  );
  const partners = users.filter(
    (u) => u.role === "partner" || u.role === "admin" || u.role === "founder",
  );
  const employees = users.filter(
    (u) => u.role === "employee" || u.role === "partner" || u.role === "admin",
  );

  // Form state
  const [formData, setFormData] = useState<FormData>({
    slug: initialData?.slug || "",
    title: initialData?.title || "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userId: (initialData as any)?.user_id || (initialData as any)?.userId || "",
    client: initialData?.client || "",
    clientEmail:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (initialData as any)?.client_email ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (initialData as any)?.clientEmail ||
      "",
    category: initialData?.category || CATEGORIES[0]!,
    tagline: initialData?.tagline || "",
    description: initialData?.description || "",
    challenge: initialData?.challenge || "",
    solution: initialData?.solution || "",
    results: initialData?.results || [],
    technologies: initialData?.technologies || [],
    testimonial: initialData?.testimonial || {
      quote: "",
      author: "",
      role: "",
    },
    image: initialData?.image || null,
    featured: initialData?.featured || false,
    order: initialData?.order || 0,
    status: initialData?.status || "active",
    progress: initialData?.progress || 0,
    startDate: initialData?.startDate || "",
    deadline: initialData?.deadline || "",
    budget: initialData?.budget || 0,
    paidAmount: initialData?.paidAmount || 0,
    assignedPartner: initialData?.assignedPartner || "",
    assignedEmployees: initialData?.assignedEmployees || [],
  });

  // Local state for tech input
  const [techInput, setTechInput] = useState("");

  // Local helper to map user full name
  const getUserName = (u: UserProfile) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (u as any).full_name || u.displayName || u.email || "No Name";
  };

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-fill client name and email if a userId is selected
      if (field === "userId") {
        const selectedUser = users.find((u) => u.uid === value);
        if (selectedUser) {
          updated.client = getUserName(selectedUser);
          updated.clientEmail = selectedUser.email || "";
        }
      }
      return updated;
    });
  };

  // Metrics handlers
  const addMetric = () => {
    setFormData((prev) => ({
      ...prev,
      results: [...prev.results, { metric: "", value: "" }],
    }));
  };

  const updateMetric = (
    index: number,
    field: "metric" | "value",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      results: prev.results.map((m, i) =>
        i === index ? { ...m, [field]: value } : m,
      ),
    }));
  };

  const removeMetric = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      results: prev.results.filter((_, i) => i !== index),
    }));
  };

  // Tech handlers
  const addTech = () => {
    if (!techInput.trim()) return;
    if (formData.technologies.includes(techInput.trim())) {
      toast.error("Technology already added");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      technologies: [...prev.technologies, techInput.trim()],
    }));
    setTechInput("");
  };

  const removeTech = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  const handleTechKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTech();
    }
  };

  // Checkbox handlers for assigned employees
  const handleEmployeeToggle = (uid: string) => {
    setFormData((prev) => {
      const isAssigned = prev.assignedEmployees.includes(uid);
      const newEmployees = isAssigned
        ? prev.assignedEmployees.filter((id) => id !== uid)
        : [...prev.assignedEmployees, uid];
      return { ...prev, assignedEmployees: newEmployees };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!formData.userId) {
      toast.error("Client User selection is required");
      return;
    }
    if (!formData.client.trim()) {
      toast.error("Client name is required");
      return;
    }

    // Sanitize slug
    const cleanSlug = formData.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const submissionData = {
      ...formData,
      slug: cleanSlug,
      // If testimonial values are empty, store as null
      testimonial:
        formData.testimonial?.quote.trim() &&
        formData.testimonial?.author.trim()
          ? formData.testimonial
          : null,
    };

    startTransition(async () => {
      let result;
      if (mode === "create") {
        result = await createProject(submissionData);
      } else {
        result = await updateProject(initialData!.slug, submissionData);
      }

      if (result.success) {
        toast.success(
          mode === "create"
            ? "Project created successfully!"
            : "Project updated successfully!",
        );
        router.push("/admin/projects");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to save project");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">
            {mode === "create" ? "New Project" : `Edit: ${initialData?.title}`}
          </h1>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mode === "create" ? "Create Project" : "Save Changes"}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info Card */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">Basic Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-white/70">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    updateField("title", e.target.value);
                    if (mode === "create") {
                      // Generate slug automatically
                      const generated = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "");
                      updateField("slug", generated);
                    }
                  }}
                  placeholder="e.g., Enterprise E-Commerce Platform"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-white/70">
                  Project Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="e.g., enterprise-ecommerce-platform"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Client User Profile *
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => updateField("userId", e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none bg-[#0a0a0a]"
                >
                  <option value="">-- Select Client Profile --</option>
                  {clients.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {getUserName(u)} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Client Display Name *
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => updateField("client", e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Client Contact Email
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => updateField("clientEmail", e.target.value)}
                  placeholder="e.g., contact@acme.com"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none bg-[#0a0a0a]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-white/70">
                  Tagline *
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="Short tagline summarizing the project outcome"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Project Management Settings */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">
              Project Management & Timelines
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Project Status
                </label>
                <select
                  value={formData.status}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => updateField("status", e.target.value as any)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none bg-[#0a0a0a]"
                >
                  {STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-white/70">
                  Progress ({formData.progress}%)
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) =>
                      updateField("progress", parseInt(e.target.value) || 0)
                    }
                    className="flex-1 accent-cyan-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) =>
                      updateField(
                        "progress",
                        Math.max(
                          0,
                          Math.min(100, parseInt(e.target.value) || 0),
                        ),
                      )
                    }
                    className="w-16 text-center rounded-md border border-white/10 bg-white/5 py-1 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Start Date
                </label>
                <input
                  type="date"
                  value={
                    formData.startDate ? formData.startDate.split("T")[0]! : ""
                  }
                  onChange={(e) => updateField("startDate", e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Deadline / End Date
                </label>
                <input
                  type="date"
                  value={
                    formData.deadline ? formData.deadline.split("T")[0]! : ""
                  }
                  onChange={(e) => updateField("deadline", e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) =>
                    updateField("order", parseInt(e.target.value) || 0)
                  }
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Total Budget ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={(e) =>
                    updateField("budget", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Paid Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.paidAmount}
                  onChange={(e) =>
                    updateField("paidAmount", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Description & Detail Texts */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
            <div>
              <h2 className="mb-1 font-semibold text-white font-sans">
                Full Description
              </h2>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe the scope, objectives, and parameters of the project..."
                rows={4}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none mt-2"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-white/70">
                The Challenge
              </label>
              <textarea
                value={formData.challenge}
                onChange={(e) => updateField("challenge", e.target.value)}
                placeholder="What challenges or issues were encountered in this project?"
                rows={3}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-white/70">
                Our Solution
              </label>
              <textarea
                value={formData.solution}
                onChange={(e) => updateField("solution", e.target.value)}
                placeholder="How did the team resolve these challenges?"
                rows={3}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Results / Metrics Card */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">
                Project Results / Metrics
              </h2>
              <button
                type="button"
                onClick={addMetric}
                className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
              >
                <Plus className="h-4 w-4" />
                Add Metric
              </button>
            </div>
            {formData.results.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-2">
                No metrics added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.results.map((metric, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={metric.value}
                      onChange={(e) =>
                        updateMetric(index, "value", e.target.value)
                      }
                      placeholder="e.g., 99.9%"
                      className="w-32 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={metric.metric}
                      onChange={(e) =>
                        updateMetric(index, "metric", e.target.value)
                      }
                      placeholder="e.g., Uptime Guarantee"
                      className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeMetric(index)}
                      className="rounded-md p-2 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <ImageUpload
              currentImage={formData.image}
              onUpload={async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                const result = await uploadFile(formData);
                if (result.success && result.url) {
                  updateField("image", result.url);
                  return { url: result.url };
                }
                return { url: "", error: result.error };
              }}
              onRemove={async () => {
                updateField("image", null);
                return { success: true };
              }}
              label="Cover Image"
            />
          </div>

          {/* Settings / Featured Toggle */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">Visibility</h2>
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-sm text-white/70">Featured Project</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => updateField("featured", e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-white/10 transition-colors peer-checked:bg-cyan-500/50" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white/50 transition-all peer-checked:left-[22px] peer-checked:bg-cyan-400" />
              </div>
            </label>
          </div>

          {/* Team Assignment */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
            <h2 className="font-semibold text-white">Team Assignment</h2>

            <div>
              <label className="mb-1.5 block text-sm text-white/70">
                Lead Partner
              </label>
              <select
                value={formData.assignedPartner}
                onChange={(e) => updateField("assignedPartner", e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none bg-[#0a0a0a]"
              >
                <option value="">-- No Partner Assigned --</option>
                {partners.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {getUserName(u)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-white/70">
                Assigned Employees
              </label>
              {employees.length === 0 ? (
                <p className="text-xs text-white/30">
                  No employees registered.
                </p>
              ) : (
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-2">
                  {employees.map((u) => {
                    const isChecked = formData.assignedEmployees.includes(
                      u.uid,
                    );
                    return (
                      <label
                        key={u.uid}
                        className="flex items-center gap-3 cursor-pointer text-sm text-white/70 hover:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleEmployeeToggle(u.uid)}
                          className="rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                        />
                        <span>{getUserName(u)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Technologies Card */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">Technologies</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={handleTechKeyDown}
                placeholder="e.g., Next.js"
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={addTech}
                className="rounded-md bg-white/10 px-3 py-2 text-white/70 transition-colors hover:bg-white/20"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {formData.technologies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs text-white/70"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="text-white/30 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Testimonial Card */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6 space-y-3">
            <h2 className="font-semibold text-white">Client Testimonial</h2>
            <div>
              <label className="mb-1 block text-xs text-white/50">Quote</label>
              <textarea
                value={formData.testimonial?.quote || ""}
                onChange={(e) =>
                  updateField("testimonial", {
                    quote: e.target.value,
                    author: formData.testimonial?.author || "",
                    role: formData.testimonial?.role || "",
                  })
                }
                placeholder="What did the client say?"
                rows={2}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/50">
                  Author Name
                </label>
                <input
                  type="text"
                  value={formData.testimonial?.author || ""}
                  onChange={(e) =>
                    updateField("testimonial", {
                      quote: formData.testimonial?.quote || "",
                      author: e.target.value,
                      role: formData.testimonial?.role || "",
                    })
                  }
                  placeholder="e.g., John Doe"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">
                  Author Role
                </label>
                <input
                  type="text"
                  value={formData.testimonial?.role || ""}
                  onChange={(e) =>
                    updateField("testimonial", {
                      quote: formData.testimonial?.quote || "",
                      author: formData.testimonial?.author || "",
                      role: e.target.value,
                    })
                  }
                  placeholder="e.g., CEO, Acme Corp"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
