import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { 
  FolderKanban, 
  FileJson, 
  Sparkles, 
  Video,
  ArrowRight
} from "lucide-react";

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">
          Welcome to Prism Engine — your context governance platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard 
          label="Projects" 
          value={projectCount} 
          icon={FolderKanban}
          href="/projects"
        />
        <StatCard 
          label="Rules" 
          value={ruleCount} 
          icon={FileJson}
          href="/projects"
        />
        <StatCard 
          label="AI Generations" 
          value={0} 
          icon={Sparkles}
          href="/generate"
        />
        <StatCard 
          label="Video Contexts" 
          value={0} 
          icon={Video}
          href="/videos"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <QuickActionCard
          href="/projects/new"
          title="Create New Project"
          description="Set up a new context environment for AI development."
          icon={FolderKanban}
          gradient="from-cyan-500/20 to-violet-500/20"
        />
        <QuickActionCard
          href="/brand/new"
          title="Create Brand Profile"
          description="Define your company's brand guidelines for AI."
          icon={Sparkles}
          gradient="from-amber-500/20 to-orange-500/20"
        />
      </div>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Recent Projects</h2>
            <Link
              href="/projects"
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recentProjects.map((project) => (
              <Link
                key={project._id.toString()}
                href={`/projects/${project.slug}`}
                className="rounded-md border border-white/[0.05] bg-white/[0.02] p-4 hover:border-white/10 transition-colors"
              >
                <p className="text-sm font-medium text-white">{project.name as string}</p>
                <p className="text-xs text-white/40 mt-1">
                  {project.stack as string} • {project.designSystem as string}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon,
  href
}: { 
  label: string; 
  value: number; 
  icon: typeof FolderKanban;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border border-white/[0.05] bg-white/[0.02] p-4 hover:border-white/10 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4 text-white/20" />
      </div>
      <p className="text-2xl font-semibold text-white mt-2">{value}</p>
    </Link>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  icon: Icon,
  gradient,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof FolderKanban;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-white/20"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/5 mb-4">
          <Icon className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-base font-medium text-white">{title}</h3>
        <p className="text-sm text-white/50 mt-1">{description}</p>
      </div>
    </Link>
  );
}
