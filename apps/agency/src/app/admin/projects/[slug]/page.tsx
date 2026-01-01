import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, User, Users } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getProjects } from '@/lib/data';
import { ProgressBar } from '@/components/admin/progress-bar';
import { ProjectStatusSelector } from '@/components/admin/project-status-selector';
import { MilestonesList } from '@/components/admin/milestones-list';
import type { FirestoreProject, ProjectMilestone } from '@/types/firestore';

export const dynamic = 'force-dynamic';

/**
 * Project Detail Page
 * --------------------
 * Full project management view with milestones, progress, and details.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const projects = await getProjects();
  const project = projects.find((p) => p.slug === slug) as FirestoreProject | undefined;

  if (!project) {
    notFound();
  }

  // Default values for new management fields
  const status = project.status || 'pending';
  const progress = project.progress || 0;
  const milestones = (project.milestones || []) as ProjectMilestone[];
  const deadline = project.deadline;
  const budget = project.budget;
  const paidAmount = project.paidAmount || 0;

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
            <ProjectStatusSelector slug={slug} currentStatus={status} />
          </div>
          <p className="mt-2 text-white/50">{project.client} • {project.category}</p>
          {project.refNo && (
            <p className="mt-1 font-mono text-xs text-white/30">{project.refNo}</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          {deadline && (
            <div className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.02] px-4 py-2">
              <Calendar className="h-4 w-4 text-white/40" />
              <span className="text-sm text-white/70">
                Due: {new Date(deadline).toLocaleDateString()}
              </span>
            </div>
          )}
          {budget !== undefined && (
            <div className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.02] px-4 py-2">
              <DollarSign className="h-4 w-4 text-emerald-400/70" />
              <span className="text-sm text-white/70">
                ${paidAmount.toLocaleString()} / ${budget.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mt-8 rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 font-semibold text-white">Progress</h2>
        <ProgressBar value={progress} size="lg" />
      </div>

      {/* Main Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Milestones */}
        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-white">Milestones</h2>
          <MilestonesList slug={slug} milestones={milestones} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">Team</h2>
            
            {project.assignedPartner ? (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                  <User className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-white">Partner</div>
                  <div className="text-xs text-white/40">{project.assignedPartner}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/30">No partner assigned</p>
            )}

            {project.assignedEmployees && project.assignedEmployees.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20">
                  <Users className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm text-white">Employees</div>
                  <div className="text-xs text-white/40">
                    {project.assignedEmployees.length} assigned
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/40">Category</dt>
                <dd className="text-white">{project.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/40">Technologies</dt>
                <dd className="text-white">{project.technologies.length} tech</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/40">Featured</dt>
                <dd className="text-white">{project.featured ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>

          {/* Tech Stack */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="rounded-sm bg-white/5 px-2 py-1 font-mono text-xs text-white/60"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
