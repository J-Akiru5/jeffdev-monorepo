'use client';

/**
 * Project Card Component
 * -----------------------
 * Client component for project list item with interactive status selector.
 */

import Link from 'next/link';
import { ProgressBar } from '@/components/admin/progress-bar';
import { ProjectStatusSelector } from '@/components/admin/project-status-selector';
import type { FirestoreProject, ProjectMilestone } from '@/types/firestore';

interface ProjectCardProps {
  project: FirestoreProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const milestones = (project.milestones || []) as ProjectMilestone[];

  return (
    <div className="group rounded-md border border-white/[0.08] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/projects/${project.slug}`}
              className="text-lg font-semibold text-white group-hover:text-cyan-400"
            >
              {project.title}
            </Link>
            <div onClick={(e) => e.stopPropagation()}>
              <ProjectStatusSelector
                slug={project.slug}
                currentStatus={project.status || 'pending'}
              />
            </div>
          </div>
          <p className="mt-1 text-sm text-white/50">
            {project.client} • {project.category}
          </p>
          {project.refNo && (
            <p className="mt-1 font-mono text-xs text-white/30">{project.refNo}</p>
          )}
        </div>

        <div className="ml-6 w-32">
          <ProgressBar value={project.progress || 0} size="sm" />
        </div>
      </div>

      {/* Milestones Preview */}
      {milestones.length > 0 && (
        <div className="mt-4 flex gap-2">
          <span className="text-xs text-white/30">Milestones:</span>
          <div className="flex gap-1">
            {milestones.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className={`h-2 w-2 rounded-full ${
                  m.status === 'completed'
                    ? 'bg-emerald-400'
                    : m.status === 'in-progress'
                    ? 'bg-yellow-400'
                    : 'bg-white/20'
                }`}
              />
            ))}
            {milestones.length > 5 && (
              <span className="text-xs text-white/30">
                +{milestones.length - 5}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Full card link overlay */}
      <Link
        href={`/admin/projects/${project.slug}`}
        className="absolute inset-0"
        aria-label={`View ${project.title}`}
      />
    </div>
  );
}
