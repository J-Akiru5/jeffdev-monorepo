import Link from "next/link";
import { Plus, Palette } from "lucide-react";
import { getUserBrands } from "./actions";

/**
 * Brands List Page
 * Shows all user brand profiles with option to create new ones.
 */
export default async function BrandsPage() {
  const brands = await getUserBrands();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Brand Profiles</h1>
          <p className="text-sm text-white/50 mt-1">
            Define your brand identity for AI-powered consistency
          </p>
        </div>
        <Link
          href="/brand/new"
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/2 px-4 py-2 text-sm font-medium text-white transition-all hover:border-cyan-500/50 hover:bg-cyan-500/10"
        >
          <Plus className="h-4 w-4" />
          New Brand
        </Link>
      </div>

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <BrandCard key={brand._id.toString()} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-white/1 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
        <Palette className="h-6 w-6 text-white/40" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-white">No brands yet</h3>
      <p className="mt-2 text-sm text-white/50">
        Create your first brand profile to generate Prism Rules.
      </p>
      <Link
        href="/brand/new"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/20"
      >
        <Plus className="h-4 w-4" />
        Create Brand
      </Link>
    </div>
  );
}

function BrandCard({ brand }: { brand: Record<string, unknown> }) {
  const slug = brand.slug as string;
  const name = brand.companyName as string;
  const industry = brand.industry as string;
  const colors = brand.colors as { primary: string; accent: string };
  
  return (
    <Link
      href={`/brand/${slug}`}
      className="group rounded-md border border-white/5 bg-white/2 p-6 transition-all hover:border-white/12 hover:bg-white/4"
    >
      {/* Color Preview */}
      <div className="flex gap-1.5 mb-4">
        <div 
          className="h-6 w-6 rounded-full border border-white/10" 
          style={{ backgroundColor: colors.primary }}
        />
        <div 
          className="h-6 w-6 rounded-full border border-white/10" 
          style={{ backgroundColor: colors.accent }}
        />
      </div>
      
      <h3 className="text-base font-medium text-white group-hover:text-cyan-400 transition-colors">
        {name}
      </h3>
      
      <div className="mt-2">
        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50 capitalize">
          {industry}
        </span>
      </div>
    </Link>
  );
}
