import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";
import { getCollection } from "@jeffdev/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Projects List Page
 * Shows all user projects with option to create new ones.
 */
export default async function ProjectsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Fetch user's projects from Cosmos DB
  const projectsCollection = await getCollection("projects");
  const projects = await projectsCollection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="text-sm text-white/50 mt-1">
            Manage your Prism contexts and rules
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-medium text-white transition-all hover:border-cyan-500/50 hover:bg-cyan-500/10"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project._id.toString()} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-white/[0.01] py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
        <FolderKanban className="h-6 w-6 text-white/40" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-white">No projects yet</h3>
      <p className="mt-2 text-sm text-white/50">
        Create your first project to start building context rules.
      </p>
      <Link
        href="/projects/new"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/20"
      >
        <Plus className="h-4 w-4" />
        Create Project
      </Link>
    </div>
  );
}

function ProjectCard({ project }: { project: Record<string, unknown> }) {
  const slug = project.slug as string;
  const name = project.name as string;
  const designSystem = project.designSystem as string;
  const stack = project.stack as string;
  
  return (
    <Link
      href={`/projects/${slug}`}
      className="group rounded-md border border-white/[0.05] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10">
          <FolderKanban className="h-5 w-5 text-cyan-400" />
        </div>
        <span className="font-mono text-xs text-white/30 uppercase">
          {stack}
        </span>
      </div>
      
      <h3 className="mt-4 text-base font-medium text-white group-hover:text-cyan-400 transition-colors">
        {name}
      </h3>
      
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
          {designSystem}
        </span>
      </div>
    </Link>
  );
}
