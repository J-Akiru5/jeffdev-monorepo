"use client";

/**
 * Product Comparison Component
 *
 * Side-by-side comparison of 2-3 product templates.
 */

import { useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight, Globe, Layers, Wrench } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface ProductTemplate {
  id: string;
  name: string;
  slug: string;
  category: "template" | "boilerplate" | "addon";
  tagline: string | null;
  features: { name: string; description: string; included: boolean }[];
  tech_stack: string[];
  highlighted: boolean;
}

interface ContractTerm {
  id: string;
  template_id: string;
  term_months: number;
  billing_cycle: "monthly" | "annual";
  price_php: number;
  price_usd: number;
}

interface ProductComparisonProps {
  templates: ProductTemplate[];
  contractTerms: ContractTerm[];
}

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const categoryConfig: Record<
  string,
  { label: string; icon: typeof Globe; color: string }
> = {
  template: { label: "Template", icon: Globe, color: "text-cyan-400" },
  boilerplate: { label: "Boilerplate", icon: Layers, color: "text-violet-400" },
  addon: { label: "Add-on", icon: Wrench, color: "text-emerald-400" },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProductComparison({
  templates,
  contractTerms,
}: ProductComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    templates.slice(0, 3).map((t) => t.id)
  );

  const selectedTemplates = templates.filter((t) =>
    selectedIds.includes(t.id)
  );

  // Collect all unique feature names across selected templates
  const allFeatureNames = Array.from(
    new Set(
      selectedTemplates.flatMap((t) =>
        (t.features || []).map((f) => f.name)
      )
    )
  );

  const formatPrice = (php: number, usd: number) => {
    return `₱${php.toLocaleString()} / $${usd.toLocaleString()}`;
  };

  const getLowestMonthlyPrice = (templateId: string) => {
    const terms = contractTerms.filter(
      (t) =>
        t.template_id === templateId &&
        t.billing_cycle === "monthly" &&
        t.term_months === 36
    );
    if (terms.length === 0) return null;
    return terms.reduce((lowest, term) =>
      term.price_usd < lowest.price_usd ? term : lowest
    );
  };

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">
          Select templates to compare (up to 3)
        </h3>
        <div className="flex flex-wrap gap-2">
          {templates.map((template) => {
            const isSelected = selectedIds.includes(template.id);
            const catConfig =
              categoryConfig[template.category] || categoryConfig.template;

            return (
              <button
                key={template.id}
                onClick={() => toggleTemplate(template.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <catConfig.icon className={`h-3 w-3 ${catConfig.color}`} />
                {template.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedTemplates.length < 2 ? (
        <div className="text-center py-12 border border-dashed border-white/5 rounded-lg">
          <p className="text-sm text-white/40">
            Select at least 2 templates to compare
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-4 px-4 text-xs text-white/40 uppercase tracking-wider font-medium w-48">
                  Feature
                </th>
                {selectedTemplates.map((template) => {
                  const catConfig =
                    categoryConfig[template.category] || categoryConfig.template;
                  return (
                    <th
                      key={template.id}
                      className="text-center py-4 px-4 min-w-[200px]"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span
                          className={`text-[10px] font-mono uppercase ${catConfig.color}`}
                        >
                          {catConfig.label}
                        </span>
                        <Link
                          href={`/products/${template.slug}`}
                          className="text-sm font-semibold text-white hover:text-amber-400 transition-colors"
                        >
                          {template.name}
                        </Link>
                        <span className="text-xs text-white/40">
                          {template.tagline}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Price Row */}
              <tr className="border-b border-white/5">
                <td className="py-4 px-4 text-sm text-white/60 font-medium">
                  Monthly Price (3yr)
                </td>
                {selectedTemplates.map((template) => {
                  const price = getLowestMonthlyPrice(template.id);
                  return (
                    <td
                      key={template.id}
                      className="text-center py-4 px-4"
                    >
                      {price ? (
                        <div>
                          <p className="text-lg font-mono text-white">
                            {formatPrice(price.price_php, price.price_usd)}
                          </p>
                          <p className="text-[10px] text-white/30">/month</p>
                        </div>
                      ) : (
                        <span className="text-white/40">Custom</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Tech Stack Row */}
              <tr className="border-b border-white/5">
                <td className="py-4 px-4 text-sm text-white/60 font-medium">
                  Tech Stack
                </td>
                {selectedTemplates.map((template) => (
                  <td key={template.id} className="text-center py-4 px-4">
                    <div className="flex flex-wrap justify-center gap-1">
                      {(template.tech_stack || []).map((tech: string) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded bg-white/5 text-white/40 text-[10px] font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Feature Rows */}
              {allFeatureNames.map((featureName) => (
                <tr key={featureName} className="border-b border-white/5">
                  <td className="py-3 px-4 text-sm text-white/60">
                    {featureName}
                  </td>
                  {selectedTemplates.map((template) => {
                    const feature = (template.features || []).find(
                      (f) => f.name === featureName
                    );
                    const isIncluded = feature?.included ?? false;

                    return (
                      <td
                        key={template.id}
                        className="text-center py-3 px-4"
                      >
                        {feature ? (
                          <div
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                              isIncluded
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/5 text-white/20"
                            }`}
                          >
                            {isIncluded ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </div>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* CTA Row */}
              <tr>
                <td className="py-6 px-4"></td>
                {selectedTemplates.map((template) => (
                  <td key={template.id} className="text-center py-6 px-4">
                    <Link
                      href={`/products/${template.slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium transition-colors"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
