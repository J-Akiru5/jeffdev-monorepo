import { logError } from "@/lib/log-error";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";

/**
 * GET /api/analytics
 * Returns usage analytics for the authenticated user.
 * Aggregates data across projects, rules, skills, and generations.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  try {
    const db = getPrismDb();
    const countOpts = { count: "exact" as const, head: true };

    const now = new Date();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();

    const [
      { count: totalProjects },
      { count: totalRules },
      { count: totalSkills },
      { count: totalComponents },
      { count: recentProjects },
      { count: recentRules },
      { count: recentGenerations },
    ] = await Promise.all([
      db.from("prism_projects").select("id", countOpts).eq("user_id", userId),
      db.from("prism_rules").select("id", countOpts).eq("created_by", userId),
      db.from("prism_skills").select("id", countOpts).eq("created_by", userId),
      db.from("prism_components").select("id", countOpts).eq("user_id", userId),
      db
        .from("prism_projects")
        .select("id", countOpts)
        .eq("user_id", userId)
        .gte("created_at", monthStart),
      db
        .from("prism_rules")
        .select("id", countOpts)
        .eq("created_by", userId)
        .gte("created_at", monthStart),
      db
        .from("prism_components")
        .select("id", countOpts)
        .eq("user_id", userId)
        .gte("created_at", monthStart),
    ]);

    return NextResponse.json({
      totals: {
        projects: totalProjects ?? 0,
        rules: totalRules ?? 0,
        skills: totalSkills ?? 0,
        components: totalComponents ?? 0,
      },
      thisMonth: {
        projects: recentProjects ?? 0,
        rules: recentRules ?? 0,
        components: recentGenerations ?? 0,
      },
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    logError("app/api/analytics/route", "Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
