"use client";

/**
 * Products Page Content
 *
 * Client component for displaying product templates with filtering.
 */

import { useState } from "react";
import Link from "next/link";
import { Globe, Layers, Wrench, Sparkles, ArrowRight } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface ProductTemplate {
  id: string;
  name: string;
  slug: string;
  category: "template" | "boilerplate" | "addon";
  tagline: string | null;
  short_description: string | null;
  base_price_monthly_php: number | null;
  base_price_monthly_usd: number | null;
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
  discount_percent: number;
}

interface ProductsPageContentProps {
  templates: unknown[];
  contractTerms: unknown[];
}

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const categoryConfig: Record<
  string,
  { label: string; icon: typeof Globe; color: string; description: string }
> = {
  template: {
    label: "Templates",
    icon: Globe,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    description: "Complete website and app templates",
  },
  boilerplate: {
    label: "Boilerplates",
    icon: Layers,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    description: "Auth, billing, and core infrastructure",
  },
  addon: {
    label: "Add-ons",
    icon: Wrench,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    description: "AI features and integrations",
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ProductsPageContent({
  templates,
  contractTerms,
}: ProductsPageContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const typedTemplates = templates as ProductTemplate[];
  const typedTerms = contractTerms as ContractTerm[];

  const filteredTemplates =
    selectedCategory === "all"
      ? typedTemplates
      : typedTemplates.filter((t) => t.category === selectedCategory);

  const getLowestPrice = (templateId: string) => {
    const terms = typedTerms.filter((t) => t.template_id === templateId);
    if (terms.length === 0) return null;

    const monthlyTerms = terms.filter((t) => t.billing_cycle === "monthly");
    if (monthlyTerms.length === 0) return terms[0];

    return monthlyTerms.reduce((lowest, term) =>
      term.price_usd < lowest.price_usd ? term : lowest
    );
  };

  const formatPrice = (php: number, usd: number) => {
    return `₱${php.toLocaleString()} / $${usd.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Hero */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Product Catalog
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            SaaS-ready templates and boilerplates. Choose a product, subscribe for 3 years,
            and we&apos;ll handle onboarding and deployment. Need customization? Request a quote.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              All Products
            </button>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === key
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <config.icon className="h-4 w-4" />
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/40">No products found in this category.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => {
                const catConfig = (categoryConfig[template.category] || categoryConfig.template)!;
                const lowestPrice = getLowestPrice(template.id);

                return (
                  <Link
                    key={template.id}
                    href={`/products/${template.slug}`}
                    className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all"
                  >
                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase border ${catConfig.color}`}
                      >
                        <catConfig.icon className="h-3 w-3" />
                        {catConfig.label.slice(0, -1)}
                      </span>
                      {template.highlighted && (
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      )}
                    </div>

                    {/* Name & Tagline */}
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-white/50 mb-4 line-clamp-2">
                      {template.tagline || template.short_description}
                    </p>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(template.tech_stack || []).slice(0, 4).map((tech: string) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded bg-white/5 text-white/40 text-[10px] font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-white/30">Starting from</p>
                        <p className="text-lg font-mono text-white">
                          {lowestPrice
                            ? formatPrice(lowestPrice.price_php, lowestPrice.price_usd)
                            : "Custom"}
                        </p>
                        <p className="text-[10px] text-white/30">/month (3yr contract)</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto text-center rounded-xl border border-white/5 bg-white/[0.02] p-8">
          <h2 className="text-2xl font-bold text-white mb-3">
            Need Customization?
          </h2>
          <p className="text-white/50 mb-6">
            All our templates can be customized to fit your needs. Request a quote for
            branding, feature additions, integrations, or full rewrites.
          </p>
          <Link
            href="/quote"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium transition-colors"
          >
            Request Custom Quote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
