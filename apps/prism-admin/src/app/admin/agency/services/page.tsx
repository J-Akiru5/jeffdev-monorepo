import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Plus, Edit2, Trash2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deserializeDescription, deleteAgencyService } from "@/app/actions/agency-services";
import { revalidatePath } from "next/cache";

export default async function ServicesPage() {
  await cookies(); // Force dynamic rendering for admin views
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  // Delete handler as a Server Action inside the component
  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await deleteAgencyService(id);
      revalidatePath("/admin/agency/services");
    }
  }

  const categoryLabels: Record<string, string> = {
    web: "Web Development",
    saas: "SaaS Platform",
    ai: "AI Integration",
    cloud: "Cloud Infrastructure",
    mobile: "Mobile App",
    design: "Design System",
    consulting: "Consulting",
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services Catalog</h1>
          <p className="mt-1 text-sm text-white/50">
            {services?.length || 0} active packages & customization offerings
          </p>
        </div>
        <Link
          href="/admin/agency/services/new"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 active:scale-95 transition-transform"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Link>
      </div>

      <div className="grid gap-4">
        {services && services.length > 0 ? (
          services.map((svc) => {
            const meta = deserializeDescription(svc.description);
            return (
              <div
                key={svc.id}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-white">
                      {svc.name}
                    </h3>
                    <span className="rounded-sm bg-white/5 px-2 py-0.5 text-[10px] uppercase font-mono text-white/60 tracking-wider">
                      {categoryLabels[svc.category] || svc.category}
                    </span>
                    <span
                      className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono ${
                        svc.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/10 text-white/40"
                      }`}
                    >
                      {svc.status}
                    </span>
                  </div>

                  <p className="text-sm text-white/50 line-clamp-2">
                    {meta.text || "No description provided."}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs font-mono text-white/40 pt-1">
                    <div>
                      Structure: <span className="text-white/60">{meta.billingStructure === "recurring" ? "Subscription" : "One-Time"}</span>
                    </div>
                    <div>
                      Investment:{" "}
                      <span className="text-white/60">
                        {svc.price_min ? `$${svc.price_min.toLocaleString()}` : "$0"}
                        {svc.price_max ? ` - $${svc.price_max.toLocaleString()}` : "+"}
                      </span>
                    </div>
                    {meta.forcesCustomQuote && (
                      <div className="flex items-center gap-1 text-cyan-400">
                        <ShieldAlert className="h-3 w-3" />
                        Custom Quote Only
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-white/5 pt-4 md:border-t-0 md:pt-0">
                  <Link
                    href={`/admin/agency/services/${svc.id}/edit`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>

                  <form action={handleDelete} onSubmit={(e) => {
                    if (!confirm("Are you sure you want to delete this service? This cannot be undone.")) {
                      e.preventDefault();
                    }
                  }}>
                    <input type="hidden" name="id" value={svc.id} />
                    <button
                      type="submit"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-white/30 border border-dashed border-white/5 rounded-lg">
            No services registered in catalog
          </div>
        )}
      </div>
    </div>
  );
}
