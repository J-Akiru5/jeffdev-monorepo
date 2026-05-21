import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { 
  ArrowLeft, 
  Download,
  Settings, 
  FileJson,
  Video,
  Sparkles
} from "lucide-react";
import { VideoContextUploader } from "@/components/video-context-uploader";
import { RulesList, type RuleItem } from "./rules-list";


interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Project Detail Page
 * Shows project info, rules, and video uploader.
 */
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Fetch project
  const projectsCollection = await getCollection("projects");
  const project = await projectsCollection.findOne({ userId, slug });
  
  if (!project) {
    notFound();
  }

  // Fetch associated rules
  const rulesCollection = await getCollection("rules");
  const rules = await rulesCollection
    .find({ projectId: project._id.toString() })
    .sort({ priority: 1 })
    .limit(20)
    .toArray();

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-medium text-cyan-400">
              {project.stack}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/50">
              {project.designSystem}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings#export"
            className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Rules
          </Link>
          <Link
            href={`/projects/${slug}/settings`}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          label="Rules" 
          value={rules.length.toString()} 
          icon={FileJson}
        />
        <StatCard 
          label="Design System" 
          value={project.designSystem as string} 
          icon={Sparkles}
        />
        <StatCard 
          label="Stack" 
          value={project.stack as string} 
          icon={Video}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Video Uploader */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">
              📹 Video Context
            </h2>
            <Link
              href={`/projects/${slug}/videos`}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              View All Videos →
            </Link>
          </div>
          <VideoContextUploader projectId={project._id.toString()} />
        </div>

        {/* Rules List — interactive client component */}
        <RulesList
          rules={rules.map((r): RuleItem => ({
            id: (r._id as { toString: () => string }).toString(),
            name: (r.name as string) || "Untitled",
            category: (r.category as string) || "general",
            priority: (r.priority as number) || 50,
            isActive: r.isActive !== false,
            content: (r.content as string) || "",
          }))}
          projectSlug={slug}
        />
      </div>
    </div>
  );
}


function StatCard({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: string; 
  icon: typeof FileJson;
}) {
  return (
    <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4 text-white/20" />
      </div>
      <p className="text-xl font-semibold text-white mt-2">{value}</p>
    </div>
  );
}


