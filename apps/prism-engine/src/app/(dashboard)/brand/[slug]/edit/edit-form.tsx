"use client";

import { useState, useActionState } from "react";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateBrand, deleteBrand, type BrandFormState } from "../../actions";
import { useActionFeedback } from "@/lib/hooks/use-action-feedback";

interface BrandData {
  slug: string;
  companyName: string;
  tagline?: string;
  industry: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont?: string;
    scale: string;
  };
  voice: {
    personality: string;
    formality: string;
    keywords: string[];
  };
  imagery: {
    style: string;
    mood: string;
  };
  spacing: {
    unit: number;
    borderRadius: string;
  };
}

interface EditBrandFormProps {
  brand: BrandData;
}

export default function EditBrandForm({ brand }: EditBrandFormProps) {
  const [state, formAction, pending] = useActionState<BrandFormState, FormData>(
    updateBrand,
    null,
  );
  useActionFeedback(state, { successMessage: "Brand updated!" });
  const [deleting, setDeleting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    companyName: brand.companyName,
    tagline: brand.tagline || "",
    industry: brand.industry,
    colors: { ...brand.colors },
    typography: { ...brand.typography },
    voice: {
      ...brand.voice,
      keywords: Array.isArray(brand.voice.keywords)
        ? brand.voice.keywords.join(", ")
        : brand.voice.keywords || "",
    },
    imagery: { ...brand.imagery },
    spacing: { ...brand.spacing },
  });

  const updateFormData = (key: string, value: unknown) => {
    setFormData((prev) => {
      const keys = key.split(".");
      if (keys.length === 1) {
        return { ...prev, [key]: value };
      }
      const parent = keys[0]!;
      const child = keys[1]!;
      return {
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value,
        },
      };
    });
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this brand? This cannot be undone.",
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteBrand(brand.slug);
      toast.success("Brand deleted!");
    } catch {
      setDeleting(false);
      toast.error("Failed to delete brand. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back Link */}
      <Link
        href={`/brand/${brand.slug}`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Brand
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Edit Brand</h1>
          <p className="text-sm text-white/50 mt-1">
            Update your brand profile settings.
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete Brand
        </button>
      </div>

      {/* Form */}
      <form action={formAction} className="space-y-8">
        {/* Hidden slug field */}
        <input type="hidden" name="slug" value={brand.slug} />

        {/* Hidden fields for all form data */}
        <input type="hidden" name="companyName" value={formData.companyName} />
        <input type="hidden" name="tagline" value={formData.tagline} />
        <input type="hidden" name="industry" value={formData.industry} />
        <input
          type="hidden"
          name="colors.primary"
          value={formData.colors.primary}
        />
        <input
          type="hidden"
          name="colors.secondary"
          value={formData.colors.secondary}
        />
        <input
          type="hidden"
          name="colors.accent"
          value={formData.colors.accent}
        />
        <input
          type="hidden"
          name="colors.background"
          value={formData.colors.background}
        />
        <input
          type="hidden"
          name="colors.surface"
          value={formData.colors.surface}
        />
        <input type="hidden" name="colors.text" value={formData.colors.text} />
        <input
          type="hidden"
          name="colors.textMuted"
          value={formData.colors.textMuted}
        />
        <input
          type="hidden"
          name="typography.headingFont"
          value={formData.typography.headingFont}
        />
        <input
          type="hidden"
          name="typography.bodyFont"
          value={formData.typography.bodyFont}
        />
        <input
          type="hidden"
          name="typography.monoFont"
          value={formData.typography.monoFont || ""}
        />
        <input
          type="hidden"
          name="typography.scale"
          value={formData.typography.scale}
        />
        <input
          type="hidden"
          name="voice.personality"
          value={formData.voice.personality}
        />
        <input
          type="hidden"
          name="voice.formality"
          value={formData.voice.formality}
        />
        <input
          type="hidden"
          name="voice.keywords"
          value={formData.voice.keywords}
        />
        <input
          type="hidden"
          name="imagery.style"
          value={formData.imagery.style}
        />
        <input
          type="hidden"
          name="imagery.mood"
          value={formData.imagery.mood}
        />
        <input
          type="hidden"
          name="spacing.unit"
          value={formData.spacing.unit}
        />
        <input
          type="hidden"
          name="spacing.borderRadius"
          value={formData.spacing.borderRadius}
        />

        {/* Identity Section */}
        <section className="rounded-md border border-white/5 bg-white/2 p-6 space-y-4">
          <h2 className="text-sm font-medium text-white">Identity</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs text-white/50">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => updateFormData("companyName", e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/2 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-white/50">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => updateFormData("tagline", e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/2 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-white/50">Industry</label>
            <select
              value={formData.industry}
              onChange={(e) => updateFormData("industry", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="photography">Photography</option>
              <option value="tech">Technology</option>
              <option value="agency">Agency</option>
              <option value="ecommerce">E-Commerce</option>
              <option value="saas">SaaS</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>
        </section>

        {/* Colors Section */}
        <section className="rounded-md border border-white/5 bg-white/2 p-6 space-y-4">
          <h2 className="text-sm font-medium text-white">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(formData.colors).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <label className="block text-xs text-white/50 capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) =>
                      updateFormData(`colors.${key}`, e.target.value)
                    }
                    className="h-8 w-8 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      updateFormData(`colors.${key}`, e.target.value)
                    }
                    className="flex-1 rounded border border-white/10 bg-transparent px-2 py-1 text-xs font-mono text-white/70 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Section */}
        <section className="rounded-md border border-white/5 bg-white/2 p-6 space-y-4">
          <h2 className="text-sm font-medium text-white">Typography</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-xs text-white/50">
                Heading Font
              </label>
              <select
                value={formData.typography.headingFont}
                onChange={(e) =>
                  updateFormData("typography.headingFont", e.target.value)
                }
                className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-white/50">Body Font</label>
              <select
                value={formData.typography.bodyFont}
                onChange={(e) =>
                  updateFormData("typography.bodyFont", e.target.value)
                }
                className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-white/50">Scale</label>
              <select
                value={formData.typography.scale}
                onChange={(e) =>
                  updateFormData("typography.scale", e.target.value)
                }
                className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              >
                <option value="compact">Compact</option>
                <option value="default">Default</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>
          </div>
        </section>

        {/* Voice Section */}
        <section className="rounded-md border border-white/5 bg-white/2 p-6 space-y-4">
          <h2 className="text-sm font-medium text-white">Voice & Tone</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs text-white/50">Personality</label>
              <select
                value={formData.voice.personality}
                onChange={(e) =>
                  updateFormData("voice.personality", e.target.value)
                }
                className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              >
                <option value="minimal">Minimal</option>
                <option value="warm">Warm</option>
                <option value="bold">Bold</option>
                <option value="playful">Playful</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-white/50">Formality</label>
              <select
                value={formData.voice.formality}
                onChange={(e) =>
                  updateFormData("voice.formality", e.target.value)
                }
                className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              >
                <option value="casual">Casual</option>
                <option value="balanced">Balanced</option>
                <option value="formal">Formal</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs text-white/50">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={formData.voice.keywords}
              onChange={(e) => updateFormData("voice.keywords", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/2 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
        </section>

        {/* Error Display */}
        {state?.error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/30 p-4">
            <p className="text-sm text-red-400">
              Please fix the following errors:
            </p>
            <ul className="mt-2 text-xs text-red-300">
              {Object.entries(state.error).map(([key, errors]) => (
                <li key={key}>
                  {key}: {(errors as string[]).join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500/10 border border-cyan-500/30 px-6 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50 transition-colors"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
