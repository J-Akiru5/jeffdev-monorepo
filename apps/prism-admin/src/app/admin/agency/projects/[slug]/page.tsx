import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MilestonesList } from "@/components/agency/milestones-list";

/**
 * Agency Project Detail Page
 * ---------------------------
 * View a project's details, milestones, status, and progress.
 */

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-blue-500/20 text-blue-400",
  pending: "bg-white/10 text-white/60",
  archived: "bg-white/10 text-white/40",
};

export default async function AgencyProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, milestones(*)")
    .eq("slug", slug)
    .single();

  if (!project) notFound();

  const metadata = (project.metadata || {}) as Record<string, unknown>;
  const progress = (metadata.progress as number) || 0;
  const tagline = (metadata.tagline as string) || "";
  const category = (metadata.category as string) || "";
  const assignedPartner = (metadata.assignedPartner as string) || "";
  const assignedEmployees = (metadata.assignedEmployees as string[]) || [];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/agency/projects"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{project.title}</h1>
            <span
              className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                statusColors[project.status] || statusColors.pending
              }`}
            >
              {project.status}
            </span>
          </div>
          {tagline && (
            <p className="text-sm text-white/60">{tagline}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-white/40">
            {category && <span>{category}</span>}
            <span>Slug: {project.slug}</span>
            {project.client_name && <span>Client: {project.client_name}</span>}
          </div>
        </div>
        <Link
          href={`/admin/agency/projects/${slug}/edit`}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
        >
          Edit Project
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50">Progress</span>
          <span className="text-xs text-white/70 font-mono">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-500/60 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
          <h3 className="text-sm font-medium text-white/80">Details</h3>
          <div className="space-y-2 text-sm">
            {project.client_name && (
              <div className="flex justify-between">
                <span className="text-white/40">Client</span>
                <span className="text-white/70">{project.client_name}</span>
              </div>
            )}
            {project.client_email && (
              <div className="flex justify-between">
                <span className="text-white/40">Email</span>
                <span className="text-white/70">{project.client_email}</span>
              </div>
            )}
            {project.start_date && (
              <div className="flex justify-between">
                <span className="text-white/40">Start Date</span>
                <span className="text-white/70">{project.start_date}</span>
              </div>
            )}
            {project.end_date && (
              <div className="flex justify-between">
                <span className="text-white/40">Deadline</span>
                <span className="text-white/70">{project.end_date}</span>
              </div>
            )}
            {project.budget && (
              <div className="flex justify-between">
                <span className="text-white/40">Budget</span>
                <span className="text-white/70">${Number(project.budget).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
          <h3 className="text-sm font-medium text-white/80">Team</h3>
          <div className="space-y-2 text-sm">
            {assignedPartner && (
              <div className="flex justify-between">
                <span className="text-white/40">Partner</span>
                <span className="text-white/70">{assignedPartner}</span>
              </div>
            )}
            {assignedEmployees.length > 0 && (
              <div className="flex justify-between">
                <span className="text-white/40">Employees</span>
                <span className="text-white/70">{assignedEmployees.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <h3 className="text-sm font-medium text-white/80 mb-2">Description</h3>
          <p className="text-sm text-white/60 leading-relaxed">{project.description}</p>
        </div>
      )}

      {/* Milestones */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <MilestonesList slug={slug} />
      </div>
    </div>
  );
}
