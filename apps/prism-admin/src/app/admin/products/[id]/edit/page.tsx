import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { ProductTemplateForm } from "@/components/admin/product-template-form";

/**
 * Edit Product Template Page
 *
 * Fetches product template data and renders the edit form.
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductTemplatePage({ params }: PageProps) {
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

  const initialData = {
    id: template.id,
    name: template.name,
    slug: template.slug,
    category: template.category,
    tagline: template.tagline || "",
    description: template.description || "",
    short_description: template.short_description || "",
    base_price_monthly_php: template.base_price_monthly_php,
    base_price_monthly_usd: template.base_price_monthly_usd,
    base_price_annual_php: template.base_price_annual_php,
    base_price_annual_usd: template.base_price_annual_usd,
    features: (template.features as { name: string; description: string; included: boolean }[]) || [],
    tech_stack: (template.tech_stack as string[]) || [],
    demo_url: template.demo_url || "",
    repo_url: template.repo_url || "",
    documentation_url: template.documentation_url || "",
    icon: template.icon || "",
    image_url: template.image_url || "",
    highlighted: template.highlighted,
    sort_order: template.sort_order,
    status: template.status as "draft" | "active" | "archived",
  };

  return <ProductTemplateForm initialData={initialData} mode="edit" />;
}
