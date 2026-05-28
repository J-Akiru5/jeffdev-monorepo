import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { getServices } from "@/app/actions/services";
import { ServiceCard } from "@/components/admin/service-card";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const services = await getServices();

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Services</h1>
          <p className="mt-2 text-white/50">{services.length} total services</p>
        </div>
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          New Service
        </Link>
      </div>

      <div className="mt-8 grid gap-4">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}

        {services.length === 0 && (
          <div className="py-12 text-center text-white/30">
            No services found. Create your first service.
          </div>
        )}
      </div>
    </div>
  );
}
