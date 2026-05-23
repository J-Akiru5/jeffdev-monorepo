import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Agency Projects Page
 * --------------------
 * List of all projects with status.
 */

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-blue-500/20 text-blue-400",
  archived: "bg-white/10 text-white/40",
};

export default async function AgencyProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="mt-1 text-sm text-white/50">{projects?.length || 0} total projects</p>
        </div>
      </div>

      <div className="grid gap-4">
        {projects && projects.length > 0 ? projects.map((project) => (
          <div
            key={project.id}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">{project.title}</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {(project as any).client_name || "Client"} {project.start_date ? `· ${project.start_date}` : ""}
                </p>
              </div>
              <span
                className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  statusColors[project.status] || statusColors.archived
                }`}
              >
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="mt-2 text-xs text-white/30 line-clamp-2">{project.description}</p>
            )}
          </div>
        )) : (
          <div className="py-12 text-center text-white/30">No projects found</div>
        )}
      </div>
    </div>
  );
}
