import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { 
  FolderKanban, 
  FileJson, 
  Sparkles, 
  Video,
  ArrowRight,
  Plus,
  Palette
} from "lucide-react";
import { 
  MetricTile, 
  GridBackground, 
  SectionHeader, 
  GlassPanel,
  Button,
  Badge
} from "@jdstudio/ui";

/**
 * Dashboard Home Page
 * Shows overview stats and quick actions.
 */
export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Fetch stats
  const projectsCollection = await getCollection("projects");
  const rulesCollection = await getCollection("rules");
  
  const [projectCount, ruleCount, recentProjects] = await Promise.all([
    projectsCollection.countDocuments({ userId }),
    rulesCollection.countDocuments({ createdBy: userId }),
    projectsCollection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(3)
      .toArray(),
  ]);

  return (
    <div className="relative space-y-10">
      <GridBackground variant="neon" />

      {/* Hero Section */}
      <div className="relative z-10 pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">
            System Operational
          </span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
              Dashboard
            </h1>
            <p className="text-lg text-white/60 max-w-xl">
              Welcome to Prism Context Engine. Your architecture is being monitored and optimized.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="secondary" className="hidden md:flex">
              Documentation
            </Button>
            <Button variant="primary" className="shadow-glow-cyan/20">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile 
          label="Active Projects" 
          value={projectCount} 
          icon={FolderKanban}
          intent="cyan"
          href="/projects"
          trend={{ value: 12, direction: "up" }}
        />
        <MetricTile 
          label="Context Rules" 
          value={ruleCount} 
          icon={FileJson}
          intent="purple"
          href="/projects"
          trend={{ value: 5, direction: "up" }}
        />
        <MetricTile 
          label="AI Generations" 
          value="0" 
          icon={Sparkles}
          href="/generate"
          trend={{ value: 0, direction: "neutral" }}
        />
        <MetricTile 
          label="Video Contexts" 
          value="0" 
          icon={Video}
          href="/videos"
          trend={{ value: 0, direction: "neutral" }}
        />
      </div>

      {/* Quick Actions Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/projects/new" className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-6 transition-all hover:border-cyan-500/30 hover:shadow-glow-cyan/20">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 mb-4">
                <FolderKanban className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Create Project</h3>
              <p className="text-sm text-white/50 mt-1">Initialize a new context environment.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-cyan-400 transition-colors" />
          </div>
        </Link>

        <Link href="/brand/new" className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-6 transition-all hover:border-purple-500/30 hover:shadow-glow-purple/20">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 mb-4">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Brand Profile</h3>
              <p className="text-sm text-white/50 mt-1">Define visual guidelines for AI.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-purple-400 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Recent Projects */}
      <section>
        <SectionHeader 
          title="Recent Activity" 
          kicker="Projects"
          action={{ label: "View All", href: "/projects" }}
        />
        
        {recentProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {recentProjects.map((project) => (
              <Link key={project._id.toString()} href={`/projects/${project.slug}`}>
                <GlassPanel hoverEffect className="h-full p-5 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-white/5 text-white/40 group-hover:text-white transition-colors">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <Badge variant="default" className="text-[10px]">
                        Active
                      </Badge>
                    </div>
                    <h3 className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                      {project.name as string}
                    </h3>
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">
                      {project.description as string || "No description provided."}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/30">
                      {(project.stack as string)?.split(',')[0] || 'Next.js'}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {new Date(project.updatedAt as string || new Date().toISOString()).toLocaleDateString()}
                    </span>
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        ) : (
          <GlassPanel className="p-12 flex flex-col items-center justify-center text-center border-dashed border-white/10">
            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <FolderKanban className="h-6 w-6 text-white/20" />
            </div>
            <h3 className="text-white font-medium">No projects yet</h3>
            <p className="text-white/40 text-sm mt-1 max-w-xs mx-auto">
              Create your first project to start tracking context rules and architecture.
            </p>
            <Button variant="primary" size="sm" className="mt-4" asChild>
              <Link href="/projects/new">Create Project</Link>
            </Button>
          </GlassPanel>
        )}
      </section>
    </div>
  );
}
