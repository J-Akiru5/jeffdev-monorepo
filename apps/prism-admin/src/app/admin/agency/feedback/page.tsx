import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Agency Feedback Page
 * --------------------
 * View client feedback submissions.
 */

export default async function AgencyFeedbackPage() {
  const supabase = await createClient();
  const { data: feedback } = await supabase
    .from("feedback")
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
        <h1 className="text-2xl font-bold text-white">Feedback</h1>
        <p className="mt-1 text-sm text-white/50">{feedback?.length || 0} submissions</p>
      </div>

      <div className="grid gap-3">
        {feedback && feedback.length > 0 ? feedback.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < item.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`}
                  />
                ))}
              </div>
              <span
                className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  item.status === "received"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : item.status === "acknowledged"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : item.status === "resolved"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/10 text-white/40"
                }`}
              >
                {item.status}
              </span>
            </div>
            {item.comment && (
              <p className="mt-2 text-sm text-white/70">{item.comment}</p>
            )}
          </div>
        )) : (
          <div className="py-12 text-center text-white/30">No feedback yet</div>
        )}
      </div>
    </div>
  );
}
