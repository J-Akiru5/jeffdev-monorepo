/**
 * Portfolio project detail (/portfolio/[id])
 * ------------------------------------------
 * Fetches the project (with milestones + task counts) and the partner register
 * in parallel. `getPortfolioProject` returns null for a missing project or an
 * unauthenticated viewer, so both cases land on the not-found boundary.
 */

import { notFound } from "next/navigation";
import { getPortfolioData, getPortfolioProject } from "@/app/actions/portfolio";
import { createClient } from "@/lib/supabase/server";
import { ProjectDetail } from "@/components/portfolio/project-detail";

export const dynamic = "force-dynamic";

interface PortfolioProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function PortfolioProjectPage({
  params,
}: PortfolioProjectPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: auth }, project, dashboard] = await Promise.all([
    supabase.auth.getUser(),
    getPortfolioProject(id),
    getPortfolioData(),
  ]);

  if (!project) notFound();

  return (
    <ProjectDetail
      project={project}
      partners={dashboard.partners}
      currentUserId={auth.user?.id ?? null}
    />
  );
}
