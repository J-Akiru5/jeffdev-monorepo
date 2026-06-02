import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Plus, Edit2, Trash2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteAgencyQuote } from "@/app/actions/agency-quotes";
import { revalidatePath } from "next/cache";

/**
 * Agency Quotes Page
 * ------------------
 * View and manage all quote requests.
 */

const statusColors: Record<string, string> = {
  new: "bg-cyan-500/20 text-cyan-400",
  reviewed: "bg-yellow-500/20 text-yellow-400",
  responded: "bg-blue-500/20 text-blue-400",
  accepted: "bg-emerald-500/20 text-emerald-400",
  declined: "bg-red-500/20 text-red-400",
};

export default async function AgencyQuotesPage() {
  await cookies();
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await deleteAgencyQuote(id);
      revalidatePath("/admin/agency/quotes");
    }
  }

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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-white truncate">
                      {quote.name || "Anonymous"}
                    </h3>
                    <span
                      className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider flex-shrink-0 ${
                        statusColors[quote.status] || "bg-white/10 text-white/40"
                      }`}
                    >
                      {quote.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 truncate">
                    {String(quote.email || "")} &middot; {String(quote.template_selected || quote.title || "No type")}
                    {quote.customization_scope ? ` · ${String(quote.customization_scope)}` : ""}
                  </p>
                  {quote.description && (
                    <p className="mt-1.5 text-xs text-white/30 line-clamp-2">
                      {String(quote.description)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={`/admin/agency/quotes/${quote.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/agency/quotes/${quote.id}/edit`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  <form
                    action={handleDelete}
                    onSubmit={(e) => {
                      if (!confirm("Delete this quote? This cannot be undone.")) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={quote.id} />
                    <button
                      type="submit"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-white/30 border border-dashed border-white/5 rounded-lg">
            No quotes yet
          </div>
        )}
      </div>
    </div>
  );
}
