import Link from "next/link";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteFeedback, updateFeedbackStatus } from "@/app/actions/agency-feedback";
import { revalidatePath } from "next/cache";

/**
 * Agency Feedback Page
 * --------------------
 * View and manage client feedback submissions.
 */

const statusColors: Record<string, string> = {
  received: "bg-cyan-500/20 text-cyan-400",
  acknowledged: "bg-yellow-500/20 text-yellow-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
  archived: "bg-white/10 text-white/40",
};

export default async function AgencyFeedbackPage() {
  const supabase = await createClient();
  const { data: feedback } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  async function handleDelete(id: string) {
    "use server";
    await deleteFeedback(id);
    revalidatePath("/admin/agency/feedback");
  }

  async function handleStatus(id: string, status: string) {
    "use server";
    await updateFeedbackStatus(id, status);
    revalidatePath("/admin/agency/feedback");
  }

  const avgRating = feedback && feedback.length > 0
    ? (feedback.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedback.length).toFixed(1)
    : "—";

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
        <h1 className="text-2xl font-bold text-white">Feedback</h1>
        <p className="mt-1 text-sm text-white/50">
          {feedback?.length || 0} submissions &middot; {avgRating} avg rating
        </p>
      </div>

      <div className="grid gap-3">
        {feedback && feedback.length > 0 ? (
          feedback.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < item.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`}
                      />
                    ))}
                    <span className="ml-1 text-xs text-white/40">{item.rating}/5</span>
                  </div>
                  {item.user_name && (
                    <p className="mt-1 text-xs text-white/50">by {item.user_name}</p>
                  )}
                </div>
                <span
                  className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    statusColors[item.status] || statusColors.received
                  }`}
                >
                  {item.status}
                </span>
              </div>
              {item.comment && (
                <p className="mt-2 text-sm text-white/70">{item.comment}</p>
              )}
              {item.page_url && (
                <p className="mt-1 text-[10px] text-white/30">Page: {item.page_url}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                {["received", "acknowledged", "resolved"].map((s) => (
                  <form key={s} action={handleStatus.bind(null, item.id, s)}>
                    <button
                      type="submit"
                      className={`h-7 rounded border px-2 text-[11px] transition-colors ${
                        item.status === s
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-white/10 text-white/40 hover:bg-white/5 hover:text-white/60"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  </form>
                ))}
                <form
                  action={handleDelete.bind(null, item.id)}
                  onSubmit={(e) => {
                    if (!confirm("Delete this feedback?")) e.preventDefault();
                  }}
                >
                  <button
                    type="submit"
                    className="flex h-7 items-center gap-1 rounded border border-red-500/20 px-2 text-[11px] text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-white/30">No feedback yet</div>
        )}
      </div>
    </div>
  );
}
