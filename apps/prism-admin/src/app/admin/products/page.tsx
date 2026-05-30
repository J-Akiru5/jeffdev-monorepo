"use client";

/**
 * Product Templates Page
 *
 * Lists all product templates with category filters and CRUD actions.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Globe,
  Layers,
  Wrench,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  getProductTemplates,
  deleteProductTemplate,
} from "@/app/actions/products";

// =============================================================================
// TYPES
// =============================================================================

interface ProductTemplate {
  id: string;
  name: string;
  slug: string;
  category: "template" | "boilerplate" | "addon";
  tagline: string | null;
  description: string | null;
  short_description: string | null;
  base_price_monthly_php: number | null;
  base_price_monthly_usd: number | null;
  base_price_annual_php: number | null;
  base_price_annual_usd: number | null;
  features: unknown[];
  tech_stack: string[];
  demo_url: string | null;
  repo_url: string | null;
  documentation_url: string | null;
  icon: string | null;
  image_url: string | null;
  highlighted: boolean;
  sort_order: number;
  status: "draft" | "active" | "archived";
  created_at: string;
  updated_at: string;
}

type CategoryFilter = "all" | "template" | "boilerplate" | "addon";

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const categoryConfig: Record<
  string,
  { label: string; icon: typeof Package; color: string }
> = {
  template: { label: "Template", icon: Globe, color: "text-cyan-400 bg-cyan-500/10" },
  boilerplate: { label: "Boilerplate", icon: Layers, color: "text-violet-400 bg-violet-500/10" },
  addon: { label: "Add-on", icon: Wrench, color: "text-emerald-400 bg-emerald-500/10" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-white/40 bg-white/5" },
  active: { label: "Active", color: "text-emerald-400 bg-emerald-500/10" },
  archived: { label: "Archived", color: "text-white/40 bg-white/5" },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ProductTemplatesPage() {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const filters: { category?: string } = {};
    if (categoryFilter !== "all") {
      filters.category = categoryFilter;
    }
    const result = await getProductTemplates(filters);
    if (result.success && result.data) {
      setTemplates(result.data as ProductTemplate[]);
    }
    setLoading(false);
  }, [categoryFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (id: string) => {
    const result = await deleteProductTemplate(id);
    if (result.success) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
    setConfirmDelete(null);
  };

  const formatPrice = (php: number | null, usd: number | null) => {
    if (php === null && usd === null) return "Custom";
    const parts: string[] = [];
    if (php !== null) parts.push(`₱${php.toLocaleString()}`);
    if (usd !== null) parts.push(`$${usd.toLocaleString()}`);
    return parts.join(" / ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Templates</h1>
          <p className="text-sm text-white/50">
            Manage your SaaS product catalog and contract terms
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Template
        </Link>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-white/30" />
        <div className="flex gap-1">
          {(["all", "template", "boilerplate", "addon"] as CategoryFilter[]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat === "all" ? "All" : categoryConfig[cat]?.label || cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-white/40 text-sm">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/5 rounded-lg">
          <Package className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">No product templates found</p>
          <p className="text-xs text-white/20 mt-1">
            Click &quot;Add Template&quot; to create one
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => {
            const catConfig = categoryConfig[template.category] || { label: "Template", icon: Package, color: "text-cyan-400 bg-cyan-500/10" };
            const statusConf = statusConfig[template.status] || { label: "Draft", color: "text-white/40 bg-white/5" };

            return (
              <div
                key={template.id}
                className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-colors"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Category Badge */}
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${catConfig.color}`}
                  >
                    {catConfig.label}
                  </span>

                  {/* Name & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white">
                        {template.name}
                      </h3>
                      {template.highlighted && (
                        <Sparkles className="h-3 w-3 text-amber-400" />
                      )}
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${statusConf.color}`}
                      >
                        {statusConf.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">
                      {template.tagline || template.short_description || "—"}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <span className="text-sm font-mono text-white">
                      {formatPrice(
                        template.base_price_monthly_php,
                        template.base_price_monthly_usd
                      )}
                    </span>
                    <span className="text-xs text-white/40">/mo</span>
                  </div>

                  {/* Tech Stack */}
                  <div className="hidden md:flex items-center gap-1">
                    {(template.tech_stack || []).slice(0, 3).map((tech: string) => (
                      <span
                        key={tech}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {template.demo_url && (
                      <a
                        href={template.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                        title="View Demo"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Link
                      href={`/admin/products/${template.id}/edit`}
                      className="p-1.5 rounded text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setConfirmDelete(template.id)}
                      className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {confirmDelete === template.id && (
                  <div className="px-4 pb-4 flex items-center gap-3">
                    <span className="text-xs text-red-400">
                      Delete &quot;{template.name}&quot;? This will also delete all contract terms.
                    </span>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-2 py-1 text-[10px] font-medium bg-red-500/20 text-red-400 rounded border border-red-500/30 hover:bg-red-500/30"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1 text-[10px] font-medium text-white/40 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
