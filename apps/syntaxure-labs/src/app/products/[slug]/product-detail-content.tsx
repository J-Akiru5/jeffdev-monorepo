"use client";

/**
 * Product Detail Content
 *
 * Client component for displaying a single product template with contract terms.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  Globe,
  Layers,
  Wrench,
  Sparkles,
  ExternalLink,
  Calendar,
  ArrowRight,
  ShoppingCart,
  MessageSquare,
} from "lucide-react";

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
  features: { name: string; description: string; included: boolean }[];
  tech_stack: string[];
  demo_url: string | null;
  repo_url: string | null;
  documentation_url: string | null;
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
  includes: Record<string, unknown>;
  extension_enabled: boolean;
  extension_max_years: number;
  extension_rate_increase_percent: number;
  highlighted: boolean;
}

interface ProductDetailContentProps {
  template: unknown;
  contractTerms: unknown[];
}

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const categoryConfig: Record<
  string,
  { label: string; icon: typeof Globe; color: string }
> = {
  template: { label: "Template", icon: Globe, color: "text-cyan-400 bg-cyan-500/10" },
  boilerplate: { label: "Boilerplate", icon: Layers, color: "text-violet-400 bg-violet-500/10" },
  addon: { label: "Add-on", icon: Wrench, color: "text-emerald-400 bg-emerald-500/10" },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ProductDetailContent({
  template: rawTemplate,
  contractTerms: rawTerms,
}: ProductDetailContentProps) {
  const template = rawTemplate as ProductTemplate;
  const terms = rawTerms as ContractTerm[];
  const router = useRouter();

  const [selectedTerm, setSelectedTerm] = useState<ContractTerm | null>(
    terms.find((t) => t.highlighted) || terms[0] || null
  );
  const [needsCustomization, setNeedsCustomization] = useState(false);

  const catConfig = (categoryConfig[template.category] || categoryConfig.template)!;

  const formatPrice = (php: number, usd: number) => {
    return `₱${php.toLocaleString()} / $${usd.toLocaleString()}`;
  };

  const formatTerm = (months: number) => {
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0
        ? `${years} Year${years > 1 ? "s" : ""} ${remainingMonths} Months`
        : `${years} Year${years > 1 ? "s" : ""}`;
    }
    return `${months} Months`;
  };

  const includesList = [
    { key: "onboarding", label: "Onboarding Session" },
    { key: "deployment", label: "Deployment Setup" },
    { key: "training_session", label: "Training Session" },
    { key: "updates", label: "Software Updates" },
    { key: "hosting", label: "Managed Hosting" },
  ];

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Header */}
      <section className="py-12 px-4 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase ${catConfig.color}`}
                >
                  <catConfig.icon className="h-3 w-3" />
                  {catConfig.label}
                </span>
                {template.highlighted && (
                  <Sparkles className="h-4 w-4 text-amber-400" />
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {template.name}
              </h1>

              <p className="text-lg text-white/60 max-w-2xl">
                {template.tagline || template.short_description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Description */}
              {template.description && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">
                    About this {catConfig.label.toLowerCase()}
                  </h2>
                  <p className="text-white/60 whitespace-pre-wrap">
                    {template.description}
                  </p>
                </div>
              )}

              {/* Features */}
              {template.features && template.features.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">
                    What&apos;s Included
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {template.features.map((feature, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          feature.included
                            ? "border-white/5 bg-white/[0.02]"
                            : "border-white/5 bg-white/[0.01] opacity-50"
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                            feature.included
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/5 text-white/20"
                          }`}
                        >
                          {feature.included ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {feature.name}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tech Stack */}
              {template.tech_stack && template.tech_stack.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">
                    Tech Stack
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {template.tech_stack.map((tech: string) => (
                      <span
                        key={tech}
                        className="px-4 py-2 rounded-lg bg-white/5 text-white/60 text-sm font-mono"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links */}
              {(template.demo_url || template.repo_url || template.documentation_url) && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">
                    Resources
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {template.demo_url && (
                      <a
                        href={template.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Live Demo
                      </a>
                    )}
                    {template.repo_url && (
                      <a
                        href={template.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Repository
                      </a>
                    )}
                    {template.documentation_url && (
                      <a
                        href={template.documentation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Documentation
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Pricing */}
            <div className="space-y-6">
              {/* Contract Term Selector */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Choose Your Plan
                </h3>

                {terms.length === 0 ? (
                  <p className="text-sm text-white/40">
                    No contract terms available. Contact us for pricing.
                  </p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {terms.map((term) => (
                      <button
                        key={term.id}
                        onClick={() => setSelectedTerm(term)}
                        className={`w-full p-4 rounded-lg border text-left transition-all ${
                          selectedTerm?.id === term.id
                            ? "border-amber-500/50 bg-amber-500/5"
                            : "border-white/5 bg-white/[0.02] hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {formatTerm(term.term_months)}
                            </span>
                            <span
                              className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                term.billing_cycle === "monthly"
                                  ? "text-cyan-400 bg-cyan-500/10"
                                  : "text-violet-400 bg-violet-500/10"
                              }`}
                            >
                              {term.billing_cycle}
                            </span>
                          </div>
                          {term.discount_percent > 0 && (
                            <span className="text-[10px] font-mono text-emerald-400">
                              {term.discount_percent}% OFF
                            </span>
                          )}
                        </div>
                        <p className="text-xl font-mono text-white">
                          {formatPrice(term.price_php, term.price_usd)}
                          <span className="text-sm text-white/40">/mo</span>
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Term Details */}
                {selectedTerm && (
                  <>
                    {/* What's Included */}
                    <div className="mb-6">
                      <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3">
                        What&apos;s Included
                      </h4>
                      <div className="space-y-2">
                        {includesList.map((item) => (
                          <div key={item.key} className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center ${
                                (selectedTerm.includes || {})[item.key]
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-white/5 text-white/20"
                              }`}
                            >
                              {(selectedTerm.includes || {})[item.key] ? (
                                <Check className="h-2.5 w-2.5" />
                              ) : (
                                <X className="h-2.5 w-2.5" />
                              )}
                            </div>
                            <span className="text-sm text-white/60">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Extension Info */}
                    {selectedTerm.extension_enabled && (
                      <div className="mb-6 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-white/40" />
                          <span className="text-xs text-white/40">
                            Extension Available
                          </span>
                        </div>
                        <p className="text-xs text-white/60">
                          Extend up to {selectedTerm.extension_max_years} years.{" "}
                          Rate increases by {selectedTerm.extension_rate_increase_percent}% after the
                          first 2 years of the extended term.
                        </p>
                      </div>
                    )}

                    {/* Customization Options */}
                    <div className="mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={needsCustomization}
                          onChange={(e) => setNeedsCustomization(e.target.checked)}
                          className="rounded border-white/20 bg-white/[0.02] text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-white/60">
                          I need customization
                        </span>
                      </label>
                      {needsCustomization && (
                        <p className="mt-2 text-xs text-white/40 pl-6">
                          Custom branding, features, or integrations will be quoted separately.
                        </p>
                      )}
                    </div>

                    {/* CTA - Dual Gateway */}
                    {needsCustomization ? (
                      // Custom Quote Flow
                      <Link
                        href={`/quote?template=${template.slug}&term=${selectedTerm.id}&type=customization`}
                        className="w-full h-12 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium flex items-center justify-center gap-2 transition-colors border border-white/10"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Request Custom Quote
                      </Link>
                    ) : (
                      // Direct Buy Flow
                      <button
                        onClick={() => {
                          // Navigate to Maya checkout or quote form
                          router.push(`/quote?template=${template.slug}&term=${selectedTerm.id}&type=direct`);
                        }}
                        className="w-full h-12 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Buy Now
                      </button>
                    )}

                    <p className="text-xs text-white/30 text-center mt-3">
                      3-year commitment. {needsCustomization ? "Custom quote reviewed within 24hrs." : "Instant activation via Maya."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
