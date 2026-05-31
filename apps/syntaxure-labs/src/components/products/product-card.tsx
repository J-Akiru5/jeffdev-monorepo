"use client";

/**
 * Product Card Component
 *
 * Reusable card component for displaying a product template.
 */

import Link from "next/link";
import { Sparkles, ArrowRight, Globe, Layers, Wrench } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  category: "template" | "boilerplate" | "addon";
  tagline: string | null;
  short_description: string | null;
  base_price_monthly_php: number | null;
  base_price_monthly_usd: number | null;
  tech_stack: string[];
  highlighted: boolean;
  lowestPrice?: {
    price_php: number;
    price_usd: number;
  } | null;
}

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const categoryConfig: Record<
  string,
  { label: string; icon: typeof Globe; color: string }
> = {
  template: { label: "Template", icon: Globe, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  boilerplate: { label: "Boilerplate", icon: Layers, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  addon: { label: "Add-on", icon: Wrench, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProductCard({
  name,
  slug,
  category,
  tagline,
  short_description,
  tech_stack,
  highlighted,
  lowestPrice,
}: ProductCardProps) {
  const catConfig = (categoryConfig[category] || categoryConfig.template)!;

  const formatPrice = (php: number, usd: number) => {
    return `₱${php.toLocaleString()} / $${usd.toLocaleString()}`;
  };

  return (
    <Link
      href={`/products/${slug}`}
      className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all"
    >
      {/* Category Badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase border ${catConfig.color}`}
        >
          <catConfig.icon className="h-3 w-3" />
          {catConfig.label}
        </span>
        {highlighted && <Sparkles className="h-4 w-4 text-amber-400" />}
      </div>

      {/* Name & Tagline */}
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
        {name}
      </h3>
      <p className="text-sm text-white/50 mb-4 line-clamp-2">
        {tagline || short_description}
      </p>

      {/* Tech Stack */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(tech_stack || []).slice(0, 4).map((tech: string) => (
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
          <p className="text-[10px] text-white/30">/month</p>
        </div>
        <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-amber-400 transition-colors" />
      </div>
    </Link>
  );
}
