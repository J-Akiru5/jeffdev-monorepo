import { createClient } from "@/lib/supabase/server";
import ProductsPageContent from "./products-page-content";

/**
 * Products Page
 *
 * Public-facing page listing all active product templates.
 */

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("product_templates")
    .select("*")
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  const { data: contractTerms } = await supabase
    .from("contract_terms")
    .select("*")
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  return (
    <ProductsPageContent
      templates={(templates as unknown[]) || []}
      contractTerms={(contractTerms as unknown[]) || []}
    />
  );
}
