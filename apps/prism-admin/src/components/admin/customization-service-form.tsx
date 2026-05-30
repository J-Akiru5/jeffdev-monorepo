"use client";

/**
 * Customization Service Form
 *
 * Form for creating and editing customization services.
 */

import { useState } from "react";
import {
  createCustomizationService,
  updateCustomizationService,
  type CustomizationServiceInput,
} from "@/app/actions/products";

// =============================================================================
// TYPES
// =============================================================================

interface CustomizationService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pricing_model: "fixed" | "hourly" | "project";
  estimated_range_min_php: number | null;
  estimated_range_max_php: number | null;
  estimated_range_min_usd: number | null;
  estimated_range_max_usd: number | null;
  turnaround_days: number | null;
  sort_order: number;
  status: "active" | "inactive";
}

interface CustomizationServiceFormProps {
  service: CustomizationService | null;
  onClose: () => void;
  onSave: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CustomizationServiceForm({
  service,
  onClose,
  onSave,
}: CustomizationServiceFormProps) {
  const [data, setData] = useState<Partial<CustomizationService>>(
    service || {
      name: "",
      slug: "",
      description: "",
      pricing_model: "fixed",
      estimated_range_min_php: null,
      estimated_range_max_php: null,
      estimated_range_min_usd: null,
      estimated_range_max_usd: null,
      turnaround_days: null,
      sort_order: 0,
      status: "active",
    }
  );
  const [saving, setSaving] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setData((prev) => ({
      ...prev,
      name,
      slug: !prev.id ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    const input: CustomizationServiceInput = {
      name: data.name || "",
      slug: data.slug || "",
      description: data.description || null,
      pricing_model: data.pricing_model || "fixed",
      estimated_range_min_php: data.estimated_range_min_php,
      estimated_range_max_php: data.estimated_range_max_php,
      estimated_range_min_usd: data.estimated_range_min_usd,
      estimated_range_max_usd: data.estimated_range_max_usd,
      turnaround_days: data.turnaround_days,
      sort_order: data.sort_order || 0,
      status: data.status || "active",
    };

    let result;
    if (data.id) {
      result = await updateCustomizationService(data.id, input);
    } else {
      result = await createCustomizationService(input);
    }

    if (result.success) {
      onSave();
    } else {
      alert(result.error || "Failed to save");
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-[#050505] p-6">
        <h2 className="text-lg font-semibold text-white mb-6">
          {data.id ? "Edit Customization Service" : "New Customization Service"}
        </h2>

        <div className="space-y-4">
          {/* Name + Slug */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
              <input
                value={data.name || ""}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
                placeholder="Branding & Design"
              />
            </Field>

            <Field label="Slug" required>
              <input
                value={data.slug || ""}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                placeholder="branding-design"
              />
            </Field>
          </div>

          {/* Pricing Model */}
          <Field label="Pricing Model" required>
            <select
              value={data.pricing_model || "fixed"}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  pricing_model: e.target.value as "fixed" | "hourly" | "project",
                }))
              }
              className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
            >
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly Rate</option>
              <option value="project">Project Based</option>
            </select>
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={data.description || ""}
              onChange={(e) =>
                setData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 py-2 focus:outline-none focus:border-amber-500/50 resize-none"
              placeholder="Logo, color scheme, typography, and visual identity customization."
            />
          </Field>

          {/* Price Range */}
          <div>
            <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
              Price Range (PHP)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={data.estimated_range_min_php ?? ""}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    estimated_range_min_php: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                placeholder="Min PHP"
              />
              <input
                type="number"
                value={data.estimated_range_max_php ?? ""}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    estimated_range_max_php: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                placeholder="Max PHP"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
              Price Range (USD)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={data.estimated_range_min_usd ?? ""}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    estimated_range_min_usd: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                placeholder="Min USD"
              />
              <input
                type="number"
                value={data.estimated_range_max_usd ?? ""}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    estimated_range_max_usd: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                placeholder="Max USD"
              />
            </div>
          </div>

          {/* Turnaround + Status */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Turnaround (days)">
              <input
                type="number"
                value={data.turnaround_days ?? ""}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    turnaround_days: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
                placeholder="7"
              />
            </Field>

            <Field label="Status">
              <select
                value={data.status || "active"}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    status: e.target.value as "active" | "inactive",
                  }))
                }
                className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 focus:outline-none focus:border-amber-500/50"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          {/* Sort Order */}
          <Field label="Sort Order">
            <input
              type="number"
              value={data.sort_order ?? 0}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  sort_order: Number(e.target.value),
                }))
              }
              className="w-full h-9 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm px-3 font-mono focus:outline-none focus:border-amber-500/50"
            />
          </Field>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !data.name || !data.slug}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : data.id ? "Save Changes" : "Create Service"}
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
