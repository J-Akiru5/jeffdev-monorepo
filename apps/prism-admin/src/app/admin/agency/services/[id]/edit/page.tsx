import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ServiceForm } from "@/components/agency/service-form";
import { deserializeDescription } from "@/app/actions/agency-services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: svc, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !svc) {
    notFound();
  }

  const meta = deserializeDescription(svc.description);

  const defaultValues = {
    name: svc.name,
    category: svc.category,
    description: meta.text,
    priceMin: svc.price_min,
    priceMax: svc.price_max,
    status: svc.status as "active" | "inactive",
    billingStructure: meta.billingStructure,
    forcesCustomQuote: meta.forcesCustomQuote,
    coverImage: meta.coverImage || "",
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/services"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Services Catalog
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Edit Service Offer</h1>
        <p className="mt-1 text-sm text-white/50">
          Modify pricing, customization parameters, or status for this offering.
        </p>
      </div>

      <ServiceForm mode="edit" serviceId={id} defaultValues={defaultValues} />
    </div>
  );
}
