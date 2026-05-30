import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductDetailContent from "./product-detail-content";

/**
 * Product Detail Page
 *
 * Public-facing page showing product template details and contract terms.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("product_templates")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!template) {
    notFound();
  }

  const { data: contractTerms } = await supabase
    .from("contract_terms")
    .select("*")
    .eq("template_id", template.id)
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  return (
    <ProductDetailContent
      template={template as unknown}
      contractTerms={(contractTerms as unknown[]) || []}
    />
  );
}
