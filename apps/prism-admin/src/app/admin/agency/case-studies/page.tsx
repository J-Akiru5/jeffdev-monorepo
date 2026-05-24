import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Agency Case Studies Page
 * ------------------------
 * View all case studies.
 */

export default async function AgencyCaseStudiesPage() {
  const supabase = await createClient();
  const { data: caseStudies } = await supabase
    .from("case_studies")
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
        <h1 className="text-2xl font-bold text-white">Case Studies</h1>
        <p className="mt-1 text-sm text-white/50">
          {caseStudies?.length || 0} total
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {caseStudies && caseStudies.length > 0 ? (
          caseStudies.map((cs) => (
            <div
              key={cs.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
            >
              <h3 className="text-sm font-medium text-white">{cs.title}</h3>
              {cs.description && (
                <p className="mt-2 text-xs text-white/40 line-clamp-2">
                  {cs.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    cs.status === "published"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {cs.status || "draft"}
                </span>
                {cs.slug && (
                  <span className="text-[10px] text-white/30 font-mono">
                    {cs.slug}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-white/30">
            No case studies yet
          </div>
        )}
      </div>
    </div>
  );
}
