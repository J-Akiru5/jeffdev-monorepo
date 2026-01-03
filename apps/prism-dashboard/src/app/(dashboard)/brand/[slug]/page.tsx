import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { ArrowLeft, Download, Settings } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Brand Detail Page
 * Shows brand profile with export options.
 */
export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Fetch brand
  const brandsCollection = await getCollection("brands");
  const brand = await brandsCollection.findOne({ userId, slug });
  
  if (!brand) {
    notFound();
  }

  const colors = brand.colors as Record<string, string>;
  const typography = brand.typography as Record<string, string>;
  const voice = brand.voice as { personality: string; formality: string; keywords: string[] };

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/brand"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Brands
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{brand.companyName as string}</h1>
          {brand.tagline && (
            <p className="text-sm text-white/50 mt-1">{brand.tagline as string}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-medium text-cyan-400 capitalize">
              {brand.industry as string}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ExportDropdown slug={slug} />
          <Link
            href={`/brand/${slug}/edit`}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/2 px-3 py-2 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Color Palette */}
      <section className="rounded-md border border-white/5 bg-white/2 p-6">
        <h2 className="text-sm font-medium text-white mb-4">🎨 Color Palette</h2>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {Object.entries(colors).map(([name, value]) => (
            <div key={name} className="text-center">
              <div 
                className="h-12 w-12 mx-auto rounded-lg border border-white/10 shadow-lg"
                style={{ backgroundColor: value }}
              />
              <p className="text-xs text-white/50 mt-2 capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-xs font-mono text-white/30">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="rounded-md border border-white/5 bg-white/2 p-6">
        <h2 className="text-sm font-medium text-white mb-4">✍️ Typography</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Heading Font</p>
            <p className="text-lg font-semibold text-white">{typography.headingFont}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Body Font</p>
            <p className="text-lg text-white">{typography.bodyFont}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Scale</p>
            <p className="text-lg text-white capitalize">{typography.scale}</p>
          </div>
        </div>
      </section>

      {/* Voice & Tone */}
      <section className="rounded-md border border-white/5 bg-white/2 p-6">
        <h2 className="text-sm font-medium text-white mb-4">🗣️ Voice & Tone</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Personality</p>
            <p className="text-lg text-white capitalize">{voice.personality}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Formality</p>
            <p className="text-lg text-white capitalize">{voice.formality}</p>
          </div>
        </div>
        {voice.keywords?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {voice.keywords.map((k, i) => (
                <span key={i} className="text-sm bg-white/5 px-3 py-1 rounded-full text-white/70">
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Live Preview */}
      <section 
        className="rounded-md border border-white/5 p-6"
        style={{ backgroundColor: colors.background }}
      >
        <h2 className="text-sm font-medium mb-4" style={{ color: colors.text }}>👁️ Live Preview</h2>
        <div 
          className="rounded-md p-6"
          style={{ backgroundColor: colors.surface }}
        >
          <h3 
            className="text-xl font-semibold"
            style={{ color: colors.text, fontFamily: typography.headingFont }}
          >
            {brand.companyName as string}
          </h3>
          <p 
            className="text-sm mt-2"
            style={{ color: colors.textMuted, fontFamily: typography.bodyFont }}
          >
            {brand.tagline as string || `Welcome to ${brand.companyName as string}. This is a preview of your brand colors and typography.`}
          </p>
          <div className="flex gap-3 mt-4">
            <button 
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: colors.primary, color: colors.text }}
            >
              Primary Button
            </button>
            <button 
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: colors.accent, color: colors.background }}
            >
              Accent Button
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ExportDropdown({ slug }: { slug: string }) {
  return (
    <div className="relative group">
      <button className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors">
        <Download className="h-4 w-4" />
        Export Rules
      </button>
      
      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-white/10 bg-[#0a0a0a] p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
        <p className="text-xs text-white/40 px-3 py-1">IDE Rules</p>
        <ExportLink href={`/api/brand/export?slug=${slug}&format=cursor`} label=".cursorrules" />
        <ExportLink href={`/api/brand/export?slug=${slug}&format=windsurf`} label=".windsurfrules" />
        <ExportLink href={`/api/brand/export?slug=${slug}&format=vscode`} label="VS Code Settings" />
        <ExportLink href={`/api/brand/export?slug=${slug}&format=claude`} label="CLAUDE.md" />
        
        <div className="my-1 border-t border-white/5" />
        <p className="text-xs text-white/40 px-3 py-1">Design Tokens</p>
        <ExportLink href={`/api/brand/export?slug=${slug}&format=css`} label="CSS Variables" />
        <ExportLink href={`/api/brand/export?slug=${slug}&format=tailwind`} label="Tailwind Config" />
      </div>
    </div>
  );
}

function ExportLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="block rounded px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
    >
      {label}
    </a>
  );
}
