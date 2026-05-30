import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ServiceForm } from "@/components/agency/service-form";

export default function NewServicePage() {
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
        <h1 className="text-2xl font-bold text-white">Create Service Offer</h1>
        <p className="mt-1 text-sm text-white/50">
          Add a new service package or subscription program to the public offerings.
        </p>
      </div>

      <ServiceForm mode="create" />
    </div>
  );
}
