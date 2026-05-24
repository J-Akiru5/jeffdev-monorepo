import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@syntaxure-labs/db";

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
    const projectsCollection = await getCollection("projects");
    const rulesCollection = await getCollection("rules");
    const skillsCollection = await getCollection("skills");
    const componentsCollection = await getCollection("components");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      totalProjects,
      totalRules,
      totalSkills,
      totalComponents,
      recentProjects,
      recentRules,
      recentGenerations,
    ] = await Promise.all([
      projectsCollection.countDocuments({ userId }),
      rulesCollection.countDocuments({ createdBy: userId }),
      skillsCollection.countDocuments({ createdBy: userId }),
      componentsCollection.countDocuments({ userId }),
      projectsCollection.countDocuments({ userId, createdAt: { $gte: monthStart } }),
      rulesCollection.countDocuments({ createdBy: userId, createdAt: { $gte: monthStart } }),
      componentsCollection.countDocuments({ userId, createdAt: { $gte: monthStart } }),
    ]);

    return NextResponse.json({
      totals: {
        projects: totalProjects,
        rules: totalRules,
        skills: totalSkills,
        components: totalComponents,
      },
      thisMonth: {
        projects: recentProjects,
        rules: recentRules,
        components: recentGenerations,
      },
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
