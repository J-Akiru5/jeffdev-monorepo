import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/agency/projects/[slug]/milestones
 * Returns milestones for a project
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = getAdminClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ milestones: [] });
  }

  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", project.id)
    .order("due_date", { ascending: true });

  return NextResponse.json({ milestones: milestones || [] });
}
