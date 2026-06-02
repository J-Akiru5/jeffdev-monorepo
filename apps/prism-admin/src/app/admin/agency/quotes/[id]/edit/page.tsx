import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuoteEditForm } from "@/components/agency/quote-edit-form";

/**
 * Quote Edit Page
 * ----------------
 * Edit a quote's status and details.
 */

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuoteEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !quote) {
    notFound();
  }

  const defaultValues = {
    name: String(quote.name || ""),
    email: String(quote.email || ""),
    company: String(quote.company || ""),
    templateSelected: String(quote.template_selected || ""),
    customizationScope: String(quote.customization_scope || ""),
    phone: String(quote.phone || ""),
    requirements: String(quote.description || ""),
    status: String(quote.status || "new"),
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/agency/quotes/${id}`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Quote
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Edit Quote</h1>
        <p className="mt-1 text-sm text-white/50">
          Update status and details for quote from {quote.name || "Anonymous"}
        </p>
      </div>

      <QuoteEditForm quoteId={id} defaultValues={defaultValues} />
    </div>
  );
}
