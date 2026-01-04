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
          <ExportDropdown projectId={project._id.toString()} />
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
          <h2 className="text-sm font-medium text-white mb-4">
            📹 Video Context
          </h2>
          <VideoContextUploader />
        </div>

        {/* Rules List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">
              📜 Project Rules
            </h2>
            <Link
              href={`/projects/${slug}/rules/new`}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              + Add Rule
            </Link>
          </div>
          
          {rules.length === 0 ? (
            <div className="rounded-md border border-white/5 bg-white/[0.01] p-8 text-center">
              <p className="text-sm text-white/40">
                No rules yet. Upload a video or create rules manually.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <RuleCard key={rule._id.toString()} rule={rule} />
              ))}
            </div>
          )}
        </div>
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

function RuleCard({ rule }: { rule: Record<string, unknown> }) {
  return (
    <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-4 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white">{rule.name as string}</p>
          <p className="text-xs text-white/40 mt-1">
            {rule.category as string} • Priority {rule.priority as number}
          </p>
        </div>
        <span className="font-mono text-xs text-white/30">
          #{(rule._id as { toString: () => string }).toString().slice(-4)}
        </span>
      </div>
    </div>
  );
}

function ExportDropdown({ projectId }: { projectId: string }) {
  return (
    <div className="relative group">
      <button className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors">
        <Download className="h-4 w-4" />
        Export Rules
      </button>
      
      {/* Dropdown - shown on hover */}
      <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-white/10 bg-[#0a0a0a] p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
        <ExportLink href={`/api/brand/export?projectId=${projectId}&format=cursor`} label=".cursorrules" />
        <ExportLink href={`/api/brand/export?projectId=${projectId}&format=windsurf`} label=".windsurfrules" />
        <ExportLink href={`/api/brand/export?projectId=${projectId}&format=vscode`} label="VS Code Settings" />
        <ExportLink href={`/api/brand/export?projectId=${projectId}&format=claude`} label="CLAUDE.md" />
        <div className="my-1 border-t border-white/5" />
        <ExportLink href={`/api/brand/export?projectId=${projectId}&format=css`} label="CSS Variables" />
        <ExportLink href={`/api/brand/export?projectId=${projectId}&format=tailwind`} label="Tailwind Config" />
      </div>
    </div>
  );
}

function ExportLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="block rounded px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
    >
      {label}
    </a>
  );
}
