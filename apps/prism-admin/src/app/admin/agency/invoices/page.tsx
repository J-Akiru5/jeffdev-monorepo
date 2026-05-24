import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Agency Invoices Page
 * --------------------
 * List all invoices with status.
 */

const statusColors: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-emerald-500/20 text-emerald-400",
  overdue: "bg-red-500/20 text-red-400",
  cancelled: "bg-white/5 text-white/30",
};

export default async function AgencyInvoicesPage() {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <p className="mt-1 text-sm text-white/50">
          {invoices?.length || 0} total invoices
        </p>
      </div>

      <div className="grid gap-3">
        {invoices && invoices.length > 0 ? (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-cyan-400">
                    {inv.invoice_number}
                  </p>
                  <p className="text-sm text-white mt-0.5">
                    {inv.amount > 0
                      ? `$${Number(inv.amount).toLocaleString()}`
                      : "No amount"}
                  </p>
                </div>
                <span
                  className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    statusColors[inv.status] || "bg-white/10 text-white/40"
                  }`}
                >
                  {inv.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/40">
                Due{" "}
                {inv.due_date
                  ? new Date(inv.due_date).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-white/30">No invoices yet</div>
        )}
      </div>
    </div>
  );
}
