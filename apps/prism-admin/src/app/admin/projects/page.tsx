import { auth } from "@clerk/nextjs/server";
import { 
  Search, 
  Filter,
  FolderKanban,
  Calendar,
  Users,
  MoreVertical,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

/**
 * Projects Page
 * View Agency projects from Firebase
 */
export default async function ProjectsPage() {
  const { userId } = await auth();
  
  if (!userId) return null;

  // TODO: Fetch from Firebase Admin SDK (Agency data)
  // For now, show empty state
  const projects: Array<{
    id: string;
    name: string;
    client: string;
    status: "active" | "completed" | "on-hold" | "canceled";
    startDate: string;
    teamSize: number;
  }> = [];

  const stats = {
    active: projects.filter(p => p.status === "active").length,
    completed: projects.filter(p => p.status === "completed").length,
    onHold: projects.filter(p => p.status === "on-hold").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-white/50">Agency projects from JeffDev Studio</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-white/5 text-white/40 flex items-center gap-1.5">
            <FolderKanban className="h-3 w-3" />
            Firebase
          </span>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        <StatusTab label="Active" count={stats.active} active />
        <StatusTab label="Completed" count={stats.completed} />
        <StatusTab label="On Hold" count={stats.onHold} />
      </div>

      {/* Search/Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button className="h-10 px-4 rounded-lg border border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20 flex items-center gap-2 transition-colors">
          <Filter className="h-4 w-4" />
          <span className="text-sm hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="h-6 w-6 text-amber-400" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">No projects yet</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            Connect Firebase to view Agency projects from JeffDev Studio.
          </p>
          <button className="mt-4 px-4 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors">
            Connect Firebase
          </button>
        </div>
      )}
    </div>
  );
}

function StatusTab({ label, count, active = false }: { label: string; count: number; active?: boolean }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
        active 
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
          : "text-white/40 hover:text-white/60 hover:bg-white/5"
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
        active ? "bg-amber-500/30" : "bg-white/10"
      }`}>
        {count}
      </span>
    </button>
  );
}

function ProjectCard({ project }: { project: { 
  id: string;
  name: string;
  client: string;
  status: string;
  startDate: string;
  teamSize: number;
}}) {
  const statusColor = {
    active: "text-emerald-400 bg-emerald-500/15",
    completed: "text-cyan-400 bg-cyan-500/15",
    "on-hold": "text-yellow-400 bg-yellow-500/15",
    canceled: "text-red-400 bg-red-500/15",
  }[project.status] || "text-white/50 bg-white/5";

  return (
    <Link
      href={`/admin/projects/${project.id}`}
      className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:border-amber-500/30 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
            {project.name}
          </h3>
          <p className="text-xs text-white/40">{project.client}</p>
        </div>
        <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${statusColor}`}>
          {project.status.replace("-", " ")}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-white/40">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span>{new Date(project.startDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          <span>{project.teamSize}</span>
        </div>
      </div>
    </Link>
  );
}
