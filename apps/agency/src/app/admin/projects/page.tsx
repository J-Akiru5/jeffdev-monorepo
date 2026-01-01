import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getProjects } from '@/lib/data';
import type { FirestoreProject } from '@/types/firestore';
import { ProjectCard } from '@/components/admin/project-card';

/**
 * Admin Projects Page
 * --------------------
 * List of all projects with status and progress.
 */

const statusOrder = ['active', 'pending', 'paused', 'completed'];

export default async function AdminProjectsPage() {
  const projects = (await getProjects()) as FirestoreProject[];

  // Sort by status priority, then by order
  const sortedProjects = [...projects].sort((a, b) => {
    const statusA = statusOrder.indexOf(a.status || 'pending');
    const statusB = statusOrder.indexOf(b.status || 'pending');
    if (statusA !== statusB) return statusA - statusB;
    return a.order - b.order;
  });

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="mt-2 text-white/50">{projects.length} total projects</p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mt-8 grid gap-4">
        {sortedProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}

        {projects.length === 0 && (
          <div className="py-12 text-center text-white/30">
            No projects found
          </div>
        )}
      </div>
    </div>
  );
}
