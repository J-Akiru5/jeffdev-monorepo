import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import {
  Store,
  Download,
  Search,
  ArrowRight,
  ArrowLeft,
  Package,
} from "lucide-react";
import { GlassPanel, Button, Badge } from "@syntaxure/ui";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const userId = user.id;

  const params = await searchParams;
  const q = params.q || "";
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 20;

  const db = getPrismDb();
  let listQuery = db
    .from("prism_rule_sets")
    .select("_id:id, name, description, ruleIds:rule_ids, createdBy:created_by", {
      count: "exact",
    })
    .eq("is_public", true);
  if (q) listQuery = listQuery.ilike("name", `%${q}%`);

  const { data: itemRows, count: totalRaw } = await listQuery
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  const items = itemRows ?? [];
  const total = totalRaw ?? 0;

  // Count user's own published sets
  const { count: mySetsRaw } = await db
    .from("prism_rule_sets")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId)
    .eq("is_public", true);
  const mySets = mySetsRaw ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 mb-4">
            <Store className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Marketplace
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">Rule Marketplace</h1>
          <p className="text-white/60 mt-1">
            Discover and share architectural rule sets for your projects.
          </p>
        </div>
        {mySets > 0 && (
          <Badge
            variant="info"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          >
            {mySets} published
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassPanel className="p-5">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-sm text-white/50">Rule Sets Available</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <p className="text-2xl font-bold text-white">{mySets}</p>
          <p className="text-sm text-white/50">Your Published Sets</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <p className="text-2xl font-bold text-white">7</p>
          <p className="text-sm text-white/50">Categories</p>
        </GlassPanel>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search rule sets..."
          className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/30"
        />
      </form>

      {/* Listing */}
      {items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((rs) => (
            <div
              key={rs._id.toString()}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Package className="h-5 w-5" />
                </div>
                <Badge variant="default" className="text-[10px]">
                  {rs.ruleIds?.length || 0} rules
                </Badge>
              </div>
              <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                {rs.name}
              </h3>
              {rs.description && (
                <p className="text-sm text-white/50 mt-1 line-clamp-2">
                  {rs.description}
                </p>
              )}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/30">
                  by {rs.createdBy}
                </span>
                <Button variant="secondary" size="sm" asChild>
                  <Link
                    href={`/api/v1/marketplace/install/${rs._id.toString()}`}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Install
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <GlassPanel className="p-12 flex flex-col items-center text-center border-dashed border-white/10">
          <Store className="h-12 w-12 text-white/20 mb-4" />
          <h3 className="text-white font-medium">No rule sets yet</h3>
          <p className="text-white/40 text-sm mt-1 max-w-md">
            Be the first to publish! Create rules in your project, then publish
            them as a set.
          </p>
        </GlassPanel>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-4">
          {page > 1 && (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/marketplace?page=${page - 1}${q ? `&q=${q}` : ""}`}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Previous
              </Link>
            </Button>
          )}
          {page * limit < total && (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/marketplace?page=${page + 1}${q ? `&q=${q}` : ""}`}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
