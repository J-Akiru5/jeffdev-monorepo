import { createClient } from "@/lib/supabase/server";
import { WorksManager } from "@/components/admin/works-manager";

/**
 * Works Page
 * ----------
 * Unified view of all projects and case studies.
 * Queries both tables and presents them in a unified list with filter tabs.
 */

export default async function WorksPage() {
  const supabase = await createClient();

  // Fetch both tables in parallel
  const [projectsResult, caseStudiesResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, slug, description, status, created_at, client_name")
      .order("created_at", { ascending: false }),
    supabase
      .from("case_studies")
      .select("id, title, slug, description, status, created_at, industry, published_at")
      .order("created_at", { ascending: false }),
  ]);

  const projects = (projectsResult.data || []).map((p) => ({
    ...p,
    type: "project" as const,
    source: "projects" as const,
  }));

  const caseStudies = (caseStudiesResult.data || []).map((cs) => ({
    ...cs,
    type: "case_study" as const,
    source: "case_studies" as const,
  }));

  return (
    <div className="space-y-6">
      <WorksManager projects={projects} caseStudies={caseStudies} />
    </div>
  );
}
