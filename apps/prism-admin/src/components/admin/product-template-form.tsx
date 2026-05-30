"use client";

/**
 * Product Template Form
 *
 * Form for creating and editing product templates with rich features builder.
 * Used by both new and edit pages.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { ImageUpload } from "./image-upload";
import {
  createProductTemplate,
  updateProductTemplate,
  type ProductTemplateInput,
} from "@/app/actions/products";

// =============================================================================
// TYPES
// =============================================================================

interface Feature {
  name: string;
  description: string;
  included: boolean;
}

interface ProductTemplateData {
  id?: string;
  name: string;
  slug: string;
  category: "template" | "boilerplate" | "addon";
  tagline: string;
  description: string;
  short_description: string;
  base_price_monthly_php: number | null;
  base_price_monthly_usd: number | null;
  base_price_annual_php: number | null;
  base_price_annual_usd: number | null;
  features: Feature[];
  tech_stack: string[];
  demo_url: string;
  repo_url: string;
  documentation_url: string;
  icon: string;
  image_url: string;
  highlighted: boolean;
  sort_order: number;
  status: "draft" | "active" | "archived";
}

interface ProductTemplateFormProps {
  initialData?: ProductTemplateData;
  mode: "create" | "edit";
}

// =============================================================================
// DEFAULTS
// =============================================================================

const defaultData: ProductTemplateData = {
  name: "",
  slug: "",
  category: "template",
  tagline: "",
  description: "",
  short_description: "",
  base_price_monthly_php: null,
  base_price_monthly_usd: null,
  base_price_annual_php: null,
  base_price_annual_usd: null,
  features: [],
  tech_stack: [],
  demo_url: "",
  repo_url: "",
  documentation_url: "",
  icon: "",
  image_url: "",
  highlighted: false,
  sort_order: 0,
  status: "draft",
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProductTemplateForm({ initialData, mode }: ProductTemplateFormProps) {
  const router = useRouter();
  const [data, setData] = useState<ProductTemplateData>(
    initialData || defaultData
  );
  const [saving, setSaving] = useState(false);
  const [techInput, setTechInput] = useState("");

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Handle name change and auto-generate slug
  const handleNameChange = (name: string) => {
    setData((prev) => ({
      ...prev,
      name,
      slug: mode === "create" ? generateSlug(name) : prev.slug,
    }));
  };

  // Add feature
  const addFeature = () => {
    setData((prev) => ({
      ...prev,
      features: [...prev.features, { name: "", description: "", included: true }],
    }));
  };

  // Update feature
  const updateFeature = (index: number, field: keyof Feature, value: string | boolean) => {
    setData((prev) => ({
      ...prev,
      features: prev.features.map((f, i) =>
        i === index ? { ...f, [field]: value } : f
      ),
    }));
  };

  // Remove feature
  const removeFeature = (index: number) => {
    setData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Move feature up/down
  const moveFeature = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= data.features.length) return;

    const newFeatures = [...data.features];
    const [removed] = newFeatures.splice(index, 1);
    newFeatures.splice(newIndex, 0, removed!);
    setData((prev) => ({ ...prev, features: newFeatures }));
  };

  // Add tech stack item
  const addTechStack = () => {
    if (techInput.trim() && !data.tech_stack.includes(techInput.trim())) {
      setData((prev) => ({
        ...prev,
        tech_stack: [...prev.tech_stack, techInput.trim()],
      }));
      setTechInput("");
    }
  };

  // Remove tech stack item
  const removeTechStack = (tech: string) => {
    setData((prev) => ({
      ...prev,
      tech_stack: prev.tech_stack.filter((t) => t !== tech),
    }));
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);

    const input: ProductTemplateInput = {
      name: data.name,
      slug: data.slug,
      category: data.category,
      tagline: data.tagline || null,
      description: data.description || null,
      short_description: data.short_description || null,
      base_price_monthly_php: data.base_price_monthly_php,
      base_price_monthly_usd: data.base_price_monthly_usd,
      base_price_annual_php: data.base_price_annual_php,
      base_price_annual_usd: data.base_price_annual_usd,
      features: data.features,
      tech_stack: data.tech_stack,
      demo_url: data.demo_url || null,
      repo_url: data.repo_url || null,
      documentation_url: data.documentation_url || null,
      icon: data.icon || null,
      image_url: data.image_url || null,
      highlighted: data.highlighted,
      sort_order: data.sort_order,
      status: data.status,
    };

    let result;
    if (mode === "create") {
      result = await createProductTemplate(input);
    } else {
      result = await updateProductTemplate(data.id!, input);
    }

    if (result.success) {
      router.push("/admin/products");
      router.refresh();
    } else {
      alert(result.error || "Failed to save");
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white/60" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {mode === "create" ? "New Product Template" : "Edit Template"}
          </h1>
          <p className="text-sm text-white/50">
            {mode === "create"
              ? "Create a new product for your SaaS catalog"
              : `Editing "${initialData?.name || ""}"`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Form */}
        <div className="space-y-6">
          {/* Basic Info */}
          <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
            <h2 className="text-sm font-medium text-white/80">Basic Information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <input
                  value={data.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                  placeholder="Website Starter"
                />
              </Field>

              <Field label="Slug" required>
                <input
                  value={data.slug}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                  placeholder="website-starter"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" required>
                <select
                  value={data.category}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      category: e.target.value as "template" | "boilerplate" | "addon",
                    }))
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="template">Template</option>
                  <option value="boilerplate">Boilerplate</option>
                  <option value="addon">Add-on</option>
                </select>
              </Field>

              <Field label="Status">
                <select
                  value={data.status}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      status: e.target.value as "draft" | "active" | "archived",
                    }))
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </div>

            <Field label="Tagline">
              <input
                value={data.tagline}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, tagline: e.target.value }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                placeholder="Professional websites in weeks, not months"
              />
            </Field>

            <Field label="Short Description">
              <input
                value={data.short_description}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, short_description: e.target.value }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                placeholder="Brief description for cards and previews"
              />
            </Field>

            <Field label="Full Description">
              <textarea
                value={data.description}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 py-2 focus:outline-none focus:border-amber-500/50 resize-none"
                placeholder="Detailed description of the product..."
              />
            </Field>
          </section>

          {/* Pricing */}
          <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
            <h2 className="text-sm font-medium text-white/80">
              Base Pricing (Monthly)
            </h2>
            <p className="text-xs text-white/40">
              Base prices for 3-year contract. Contract terms will be created separately.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Monthly (PHP)">
                <input
                  type="number"
                  value={data.base_price_monthly_php ?? ""}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      base_price_monthly_php: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                  placeholder="2500"
                />
              </Field>

              <Field label="Monthly (USD)">
                <input
                  type="number"
                  value={data.base_price_monthly_usd ?? ""}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      base_price_monthly_usd: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                  placeholder="45"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Annual (PHP)">
                <input
                  type="number"
                  value={data.base_price_annual_php ?? ""}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      base_price_annual_php: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                  placeholder="25000"
                />
              </Field>

              <Field label="Annual (USD)">
                <input
                  type="number"
                  value={data.base_price_annual_usd ?? ""}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      base_price_annual_usd: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                  placeholder="450"
                />
              </Field>
            </div>
          </section>

          {/* Features */}
          <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-white/80">Features</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  Rich features with name, description, and included status
                </p>
              </div>
              <button
                onClick={addFeature}
                className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Feature
              </button>
            </div>

            {data.features.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/5 rounded-lg">
                <p className="text-xs text-white/40">No features added yet</p>
                <button
                  onClick={addFeature}
                  className="mt-2 text-xs text-amber-400 hover:text-amber-300"
                >
                  Add your first feature
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {data.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex flex-col gap-0.5 pt-1">
                      <button
                        onClick={() => moveFeature(index, -1)}
                        disabled={index === 0}
                        className="disabled:opacity-20"
                      >
                        <GripVertical className="h-3 w-3 text-white/30 rotate-180" />
                      </button>
                      <button
                        onClick={() => moveFeature(index, 1)}
                        disabled={index === data.features.length - 1}
                        className="disabled:opacity-20"
                      >
                        <GripVertical className="h-3 w-3 text-white/30" />
                      </button>
                    </div>

                    <div className="flex-1 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                      <input
                        value={feature.name}
                        onChange={(e) => updateFeature(index, "name", e.target.value)}
                        className="h-8 rounded border border-white/10 bg-white/[0.02] text-white text-xs px-2 focus:outline-none focus:border-amber-500/50"
                        placeholder="Feature name"
                      />
                      <input
                        value={feature.description}
                        onChange={(e) =>
                          updateFeature(index, "description", e.target.value)
                        }
                        className="h-8 rounded border border-white/10 bg-white/[0.02] text-white text-xs px-2 focus:outline-none focus:border-amber-500/50"
                        placeholder="Feature description"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={feature.included}
                            onChange={(e) =>
                              updateFeature(index, "included", e.target.checked)
                            }
                            className="rounded border-white/20 bg-white/[0.02] text-amber-500 focus:ring-amber-500"
                          />
                          <span className="text-[10px] text-white/40">Included</span>
                        </label>
                        <button
                          onClick={() => removeFeature(index)}
                          className="p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tech Stack */}
          <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
            <h2 className="text-sm font-medium text-white/80">Tech Stack</h2>

            <div className="flex gap-2">
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTechStack();
                  }
                }}
                className="flex-1 h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                placeholder="Add technology (e.g., Next.js)"
              />
              <button
                onClick={addTechStack}
                className="h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>

            {data.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-white/60 text-xs font-mono"
                  >
                    {tech}
                    <button
                      onClick={() => removeTechStack(tech)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* External Links */}
          <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
            <h2 className="text-sm font-medium text-white/80">External Links</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Demo URL">
                <input
                  value={data.demo_url}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, demo_url: e.target.value }))
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                  placeholder="https://demo.example.com"
                />
              </Field>

              <Field label="Repo URL">
                <input
                  value={data.repo_url}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, repo_url: e.target.value }))
                  }
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                  placeholder="https://github.com/..."
                />
              </Field>
            </div>

            <Field label="Documentation URL">
              <input
                value={data.documentation_url}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    documentation_url: e.target.value,
                  }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                placeholder="https://docs.example.com"
              />
            </Field>

            <ImageUpload
              bucket="services"
              currentUrl={data.image_url}
              onUpload={(url) => setData((prev) => ({ ...prev, image_url: url }))}
              onDelete={() => setData((prev) => ({ ...prev, image_url: "" }))}
              label="Product Image"
            />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
            <h2 className="text-sm font-medium text-white/80">Settings</h2>

            <Field label="Sort Order">
              <input
                type="number"
                value={data.sort_order}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    sort_order: Number(e.target.value),
                  }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
              />
            </Field>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.highlighted}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, highlighted: e.target.checked }))
                }
                className="rounded border-white/20 bg-white/[0.02] text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm text-white">Highlighted (Featured)</span>
            </label>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !data.name || !data.slug}
            className="w-full h-10 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : mode === "create" ? "Create Template" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FIELD COMPONENT
// =============================================================================

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">
        {label}
        {required && <span className="text-amber-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
