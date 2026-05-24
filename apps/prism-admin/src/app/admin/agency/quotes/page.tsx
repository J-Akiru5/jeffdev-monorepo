import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Agency Quotes Page
 * ------------------
 * View all quote requests.
 */

const statusColors: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  sent: "bg-cyan-500/20 text-cyan-400",
  accepted: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  expired: "bg-yellow-500/20 text-yellow-400",
};

export default async function AgencyQuotesPage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quote Requests</h1>
          <p className="mt-1 text-sm text-white/50">
            {quotes?.length || 0} total submissions
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {quotes && quotes.length > 0 ? (
          quotes.map((quote) => (
            <div
              key={quote.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">
                    {quote.title}
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {(quote as any).client_name || "Client"} &middot; $
                    {(quote as any).amount || 0}
                  </p>
                </div>
                <span
                  className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    statusColors[quote.status] || "bg-white/10 text-white/40"
                  }`}
                >
                  {quote.status}
                </span>
              </div>
              {quote.description && (
                <p className="mt-2 text-xs text-white/30 line-clamp-2">
                  {quote.description}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-white/30">No quotes yet</div>
        )}
      </div>
    </div>
  );
}
