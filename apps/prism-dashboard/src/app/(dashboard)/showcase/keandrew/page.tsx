import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import Link from "next/link";
import { ArrowLeft, Code, Palette, Type, MessageCircle } from "lucide-react";

/**
 * Keandrew Demo Showcase
 * Displays the seeded brand profile, rules, and component examples.
 */
export default async function KeandrewShowcasePage() {
  const { userId } = await auth();
  
  // Fetch Keandrew data
  const brandsCollection = await getCollection("brands");
  const rulesCollection = await getCollection("rules");
  const componentsCollection = await getCollection("components");

  const brand = await brandsCollection.findOne({ slug: "keandrew-photography" });
  const rules = await rulesCollection.find({ tags: { $in: ["keandrew"] } }).toArray();
  const components = await componentsCollection.find({ name: { $regex: /^Keandrew/ } }).toArray();

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-semibold text-white mb-4">Keandrew Demo Not Found</h1>
        <p className="text-white/50 mb-6">
          Run the seed script to populate demo data:
        </p>
        <code className="bg-white/5 border border-white/10 px-4 py-2 rounded text-sm font-mono text-cyan-400">
          npm run seed:keandrew
        </code>
        <Link 
          href="/brand"
          className="mt-8 text-sm text-white/50 hover:text-white transition-colors"
        >
          ← Back to Brands
        </Link>
      </div>
    );
  }

  const colors = brand.colors as Record<string, string>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link 
            href="/brand"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Brands
          </Link>
          <h1 className="text-2xl font-semibold text-white">Keandrew Photography Demo</h1>
          <p className="text-sm text-white/50 mt-1">
            Showcase of brand rules and UI component examples
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Seeded:</span>
          <span className="text-xs font-mono text-cyan-400">
            {brand.createdAt?.toString().split("T")[0] || "Unknown"}
          </span>
        </div>
      </div>

      {/* Brand Overview */}
      <section 
        className="rounded-md border p-6"
        style={{ 
          backgroundColor: colors.background,
          borderColor: `${colors.accent}30`
        }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="h-16 w-16 rounded-lg flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: colors.accent, color: colors.background }}
          >
            K
          </div>
          <div>
            <h2 style={{ color: colors.text }} className="text-xl font-semibold">
              {brand.companyName as string}
            </h2>
            <p style={{ color: colors.textMuted }} className="text-sm">
              {brand.tagline as string}
            </p>
          </div>
        </div>

        {/* Color Swatches */}
        <div className="flex gap-3">
          {Object.entries(colors).slice(0, 5).map(([name, value]) => (
            <div key={name} className="text-center">
              <div 
                className="h-8 w-8 rounded-full border"
                style={{ backgroundColor: value, borderColor: `${colors.text}20` }}
              />
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                {name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Rules Grid */}
      <section>
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Code className="h-5 w-5 text-cyan-400" />
          Prism Rules ({rules.length})
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {rules.map((rule, i) => (
            <div 
              key={i}
              className="rounded-md border border-white/5 bg-white/2 p-4 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-white">{rule.name as string}</h3>
                <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">
                  {rule.category as string}
                </span>
              </div>
              <div className="mt-2 text-xs text-white/40 font-mono flex gap-2">
                {(rule.tags as string[] || []).slice(0, 3).map((tag, j) => (
                  <span key={j}>#{tag}</span>
                ))}
              </div>
              <pre className="mt-3 text-xs text-white/50 line-clamp-3 overflow-hidden">
                {(rule.content as string)?.slice(0, 150)}...
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* Components */}
      <section>
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-violet-400" />
          UI Components ({components.length})
        </h2>
        <div className="space-y-4">
          {components.map((comp, i) => (
            <details 
              key={i}
              className="group rounded-md border border-white/5 bg-white/2 overflow-hidden"
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
                <div>
                  <h3 className="text-sm font-medium text-white">{comp.name as string}</h3>
                  <p className="text-xs text-white/40 mt-1">{comp.category as string}</p>
                </div>
                <span className="text-xs text-white/30 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="border-t border-white/5 p-4 bg-[#050505]">
                <pre className="text-xs text-white/70 overflow-x-auto">
                  <code>{comp.code as string}</code>
                </pre>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Export CTA */}
      <section className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-6 text-center">
        <h2 className="text-lg font-medium text-white mb-2">Ready to Use</h2>
        <p className="text-sm text-white/50 mb-4">
          Export these rules to your IDE and start building with Keandrew&apos;s brand system.
        </p>
        <Link
          href={`/brand/keandrew-photography`}
          className="inline-flex items-center gap-2 rounded-md bg-cyan-500/10 border border-cyan-500/30 px-6 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          View Brand Details →
        </Link>
      </section>
    </div>
  );
}
