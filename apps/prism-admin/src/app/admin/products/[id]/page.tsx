import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminClient } from "@/lib/supabase/admin";
import { Pencil, ExternalLink, Globe, Layers, Wrench } from "lucide-react";
import { ContractTermsManager } from "@/components/admin/contract-terms-manager";

/**
 * Product Detail Page
 *
 * Shows product template details and contract terms.
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

const categoryConfig: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  template: { label: "Template", icon: Globe, color: "text-cyan-400 bg-cyan-500/10" },
  boilerplate: { label: "Boilerplate", icon: Layers, color: "text-violet-400 bg-violet-500/10" },
  addon: { label: "Add-on", icon: Wrench, color: "text-emerald-400 bg-emerald-500/10" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-white/40 bg-white/5" },
  active: { label: "Active", color: "text-emerald-400 bg-emerald-500/10" },
  archived: { label: "Archived", color: "text-white/40 bg-white/5" },
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const adminClient = getAdminClient();

  const { data: template, error } = await adminClient
    .from("product_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !template) {
    notFound();
  }

  const catConfig = categoryConfig[template.category] || { label: "Template", icon: Globe, color: "text-cyan-400 bg-cyan-500/10" };
  const statusConf = statusConfig[template.status] || { label: "Draft", color: "text-white/40 bg-white/5" };
  const features = (template.features as { name: string; description: string; included: boolean }[]) || [];
  const techStack = (template.tech_stack as string[]) || [];

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
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{template.name}</h1>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${catConfig.color}`}
              >
                {catConfig.label}
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${statusConf.color}`}
              >
                {statusConf.label}
              </span>
            </div>
            <p className="text-sm text-white/50 mt-1">
              {template.tagline || template.short_description || "—"}
            </p>
          </div>
        </div>
        <Link
          href={`/admin/products/${id}/edit`}
          className="h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Pricing */}
          <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <h2 className="text-sm font-medium text-white/80 mb-3">Base Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/40">Monthly</p>
                <p className="text-lg font-mono text-white">
                  {formatPrice(template.base_price_monthly_php, template.base_price_monthly_usd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">Annual</p>
                <p className="text-lg font-mono text-white">
                  {formatPrice(template.base_price_annual_php, template.base_price_annual_usd)}
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          {features.length > 0 && (
            <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <h2 className="text-sm font-medium text-white/80 mb-3">Features</h2>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.02]"
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center ${
                        feature.included
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/5 text-white/20"
                      }`}
                    >
                      {feature.included ? "✓" : "—"}
                    </div>
                    <div>
                      <p className="text-sm text-white">{feature.name}</p>
                      <p className="text-xs text-white/40">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tech Stack */}
          {techStack.length > 0 && (
            <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <h2 className="text-sm font-medium text-white/80 mb-3">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-full bg-white/5 text-white/60 text-xs font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Description */}
          {template.description && (
            <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <h2 className="text-sm font-medium text-white/80 mb-3">Description</h2>
              <p className="text-sm text-white/60 whitespace-pre-wrap">
                {template.description}
              </p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* External Links */}
          <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <h2 className="text-sm font-medium text-white/80">External Links</h2>
            {template.demo_url && (
              <a
                href={template.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
              >
                <ExternalLink className="h-4 w-4" />
                Demo
              </a>
            )}
            {template.repo_url && (
              <a
                href={template.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
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
                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
              >
                <ExternalLink className="h-4 w-4" />
                Documentation
              </a>
            )}
            {!template.demo_url && !template.repo_url && !template.documentation_url && (
              <p className="text-xs text-white/40">No external links configured</p>
            )}
          </section>

          {/* Settings */}
          <section className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <h2 className="text-sm font-medium text-white/80">Settings</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Slug</span>
                <span className="text-white/60 font-mono text-xs">{template.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Sort Order</span>
                <span className="text-white/60">{template.sort_order}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Highlighted</span>
                <span className="text-white/60">{template.highlighted ? "Yes" : "No"}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Contract Terms */}
      <section className="mt-8">
        <ContractTermsManager templateId={id} templateName={template.name} />
      </section>
    </div>
  );
}
