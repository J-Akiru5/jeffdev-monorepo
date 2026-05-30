import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@syntaxure-labs/db";
import {
  FolderKanban,
  FileJson,
  Sparkles,
  ArrowRight,
  Plus,
  Palette,
} from "lucide-react";
import {
  MetricTile,
  SectionHeader,
  GlassPanel,
  Button,
  Badge,
} from "@syntaxure/ui";
import { UsageCard } from "@/components/usage-card";

/**
 * Dashboard Home Page
 * Shows overview stats and quick actions.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const userId = user.id;

  // Date windows for trend calculation
  const now = new Date();
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const sixtyDaysAgo = new Date(
    now.getTime() - 60 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Fetch all collections
  const projectsCollection = await getCollection("projects");
  const rulesCollection = await getCollection("rules");
  const generationsCollection = await getCollection("generations");

  const [
    projectCount,
    projectPrev,
    ruleCount,
    rulePrev,
    genCount,
    genPrev,
  ] = await Promise.all([
    projectsCollection.countDocuments({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    }),
    projectsCollection.countDocuments({
      userId,
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    }),
    rulesCollection.countDocuments({
      createdBy: userId,
      createdAt: { $gte: thirtyDaysAgo },
    }),
    rulesCollection.countDocuments({
      createdBy: userId,
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    }),
    generationsCollection.countDocuments({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    }),
    generationsCollection.countDocuments({
      userId,
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    }),
  ]);

  const recentProjects = await projectsCollection
    .find({ userId })
    .sort({ updatedAt: -1 })
    .limit(3)
    .toArray();

  // Also fetch totals for card display
  const [totalProjects, totalRules] = await Promise.all([
    projectsCollection.countDocuments({ userId }),
    rulesCollection.countDocuments({ createdBy: userId }),
  ]);

  // Helper to compute trend
  const calcTrend = (
    curr: number,
    prev: number,
  ): { value: number; direction: "up" | "down" | "neutral" } => {
    if (prev === 0 && curr === 0) return { value: 0, direction: "neutral" };
    if (prev === 0) return { value: 100, direction: "up" };
    const pct = Math.round(Math.abs(((curr - prev) / prev) * 100));
    if (curr > prev) return { value: Math.min(pct, 999), direction: "up" };
    if (curr < prev) return { value: Math.min(pct, 999), direction: "down" };
    return { value: 0, direction: "neutral" };
  };

  let greetingMsg = "Welcome to Prism Context Engine. Your architecture is being monitored and optimized.";
  if (recentProjects.length > 0) {
    const lastProject = recentProjects[0];
    if (lastProject) {
      const daysSince = Math.floor((now.getTime() - new Date(lastProject.updatedAt || now).getTime()) / (1000 * 3600 * 24));
      if (daysSince > 7) {
        greetingMsg = `Good to see you again. Project '${lastProject.name}' hasn't had context updates in ${daysSince} days.`;
      } else if (daysSince === 0) {
        greetingMsg = `System active. You made updates to '${lastProject.name}' today. Your architecture is perfectly aligned.`;
      } else {
        greetingMsg = `System active. You recently updated '${lastProject.name}'. Your architecture is healthy.`;
      }
    }
  }

  return (
    <div className="relative space-y-8">
      {/* Hero Section */}
      <div className="relative z-10 pt-4">


        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
              Dashboard
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl">
              {greetingMsg}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="hidden md:flex" asChild>
              <Link href="https://docs.syntaxure.dev" target="_blank">
                Documentation
              </Link>
            </Button>
            <Button variant="primary" className="shadow-glow-cyan/20 active:scale-[0.97] transition-transform" asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Active Projects"
          value={totalProjects}
          icon={<FolderKanban className="h-4 w-4" />}
          intent="cyan"
          href="/projects"
          trend={calcTrend(projectCount, projectPrev)}
        />
        <MetricTile
          label="Context Rules"
          value={totalRules}
          icon={<FileJson className="h-4 w-4" />}
          intent="purple"
          href="/projects"
          trend={calcTrend(ruleCount, rulePrev)}
        />
        <MetricTile
          label="AI Generations"
          value={genCount}
          icon={<Sparkles className="h-4 w-4" />}
          href="/generate"
          trend={calcTrend(genCount, genPrev)}
        />
      </div>

      {/* Bento Grid Layout */}
      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Left Column (Usage + Recent) */}
        <div className="md:col-span-8 space-y-6">
          <UsageCard />
          
          <section>
            <SectionHeader
              title="Recent Activity"
              kicker="Projects"
              action={{ label: "View All", href: "/projects" }}
            />

            {recentProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                {recentProjects.map((project: any) => (
                  <Link
                    key={project._id.toString()}
                    href={`/projects/${project.slug}`}
                    className="group"
                  >
                    <GlassPanel
                      hoverEffect
                      className="h-full p-5 flex flex-col justify-between group backdrop-blur-2xl shadow-[inset_0_1px_0_0_var(--border-subtle)] border border-[var(--border-subtle)] active:scale-[0.98] transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--border-subtle)] text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">
                            <FolderKanban className="h-4 w-4" />
                          </div>
                          <Badge variant="default" className="text-[10px]">
                            Active
                          </Badge>
                        </div>
                        <h3 className="font-medium text-[var(--text-primary)] group-hover:text-cyan-500 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">
                          {(project.description) || "No description provided."}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[var(--text-quiet)]">
                          {(project.stack?.split(",")[0]) || "Next.js"}
                        </span>
                        <span className="text-[10px] text-[var(--text-quiet)]">
                          {new Date(
                            (project.updatedAt) || new Date().toISOString(),
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </GlassPanel>
                  </Link>
                ))}
              </div>
            ) : (
              <GlassPanel className="p-12 flex flex-col items-center justify-center text-center border-dashed border-[var(--border-subtle)] mt-4 backdrop-blur-2xl">
                <div className="h-12 w-12 rounded-full bg-[var(--border-subtle)] flex items-center justify-center mb-4 mx-auto">
                  <FolderKanban className="h-6 w-6 text-[var(--text-quiet)]" />
                </div>
                <h3 className="text-[var(--text-primary)] font-medium">No projects yet</h3>
                <p className="text-[var(--text-tertiary)] text-sm mt-1 max-w-xs mx-auto">
                  Create your first project to start tracking context rules and architecture.
                </p>
                <Button variant="primary" size="sm" className="mt-4 active:scale-[0.97] transition-transform" asChild>
                  <Link href="/projects/new">Create Project</Link>
                </Button>
              </GlassPanel>
            )}
          </section>
        </div>

        {/* Right Column (Quick Actions) */}
        <div className="md:col-span-4 space-y-4">
          <SectionHeader
            title="Quick Actions"
            kicker="System"
          />
          <Link
            href="/projects/new"
            className="block group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 transition-all hover:border-blue-500/50 dark:hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] active:scale-[0.97]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 dark:from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-cyan-500/10 border border-blue-500/20 dark:border-cyan-500/20 text-blue-600 dark:text-cyan-500 mb-4 shadow-[inset_0_0_10px_rgba(37,99,235,0.1)] dark:shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Create Project
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Initialize a new context environment.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-[var(--text-quiet)] group-hover:text-cyan-500 transition-colors" />
            </div>
          </Link>

          <Link
            href="/brand/new"
            className="block group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 transition-all hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] active:scale-[0.97]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500 mb-4 shadow-[inset_0_0_10px_rgba(139,92,246,0.1)]">
                  <Palette className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Brand Profile
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Define visual guidelines for AI.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-[var(--text-quiet)] group-hover:text-purple-500 transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
