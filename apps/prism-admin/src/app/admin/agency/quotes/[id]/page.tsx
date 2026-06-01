import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteAgencyQuote } from "@/app/actions/agency-quotes";
import { revalidatePath } from "next/cache";

/**
 * Quote Detail Page
 * -----------------
 * View a single quote request with status management.
 */

const statusColors: Record<string, string> = {
  new: "bg-cyan-500/20 text-cyan-400",
  reviewed: "bg-yellow-500/20 text-yellow-400",
  responded: "bg-blue-500/20 text-blue-400",
  accepted: "bg-emerald-500/20 text-emerald-400",
  declined: "bg-red-500/20 text-red-400",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: Props) {
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

  async function handleDelete() {
    "use server";
    await deleteAgencyQuote(id);
    revalidatePath("/admin/agency/quotes");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/quotes"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Quotes
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Quote from {quote.name || "Anonymous"}
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {quote.email} &middot; Submitted {new Date(quote.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
              statusColors[quote.status] || "bg-white/10 text-white/40"
            }`}
          >
            {quote.status}
          </span>
          <Link
            href={`/admin/agency/quotes/${id}/edit`}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Link>
          <form
            action={handleDelete}
            onSubmit={(e) => {
              if (!confirm("Delete this quote? This cannot be undone.")) e.preventDefault();
            }}
          >
            <button
              type="submit"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 px-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </form>
        </div>
      </div>

      {/* Quote Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-sm font-medium text-white/80">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">Name</label>
              <p className="text-sm text-white">{quote.name || "—"}</p>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Email</label>
              <p className="text-sm text-white">{quote.email || "—"}</p>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Company</label>
              <p className="text-sm text-white">{quote.company || "—"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-sm font-medium text-white/80">Project Details</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">Project Type</label>
              <p className="text-sm text-white">{quote.project_type || quote.title || "—"}</p>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Budget Range</label>
              <p className="text-sm text-white">{quote.budget_range || "—"}</p>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Timeline</label>
              <p className="text-sm text-white">{quote.timeline || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {quote.message && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-sm font-medium text-white/80">Message</h3>
          <p className="text-sm text-white/70 whitespace-pre-wrap">{quote.message}</p>
        </div>
      )}
    </div>
  );
}
