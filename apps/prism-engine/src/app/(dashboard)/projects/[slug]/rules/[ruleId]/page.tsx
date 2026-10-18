import { createClient } from "@/lib/supabase/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, FileText } from "lucide-react";
import { GlassPanel, Badge, Button } from "@syntaxure/ui";

interface Props {
  params: Promise<{ slug: string; ruleId: string }>;
}

const SEVERITY_STYLES: Record<string, string> = {
  error: "bg-red-500/15 text-red-400 border-red-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/20",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })} UTC`;
}

/**
 * Rule View Page
 * Read-only detail view for a single project rule: full instruction,
 * metadata, and entry point to editing.
 */
export default async function RuleViewPage({ params }: Props) {
  const { slug, ruleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  if (!isValidId(ruleId)) {
    notFound();
  }

  const db = getPrismDb();

  // Fetch project (scoped to the authenticated user)
  const { data: project } = await db
    .from("prism_projects")
    .select("id")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  // Fetch rule (scoped to the project so foreign ids 404)
  const { data: rule } = await db
    .from("prism_rules")
    .select(
      "id, name, description, category, content, priority, severity, is_active, pattern, tags, source, created_at, updated_at",
    )
    .eq("id", ruleId)
    .eq("project_id", project.id)
    .maybeSingle();

  if (!rule) {
    notFound();
  }

  const severity = rule.severity || "warning";
  const tags = (rule.tags as string[] | null) ?? [];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href={`/projects/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="info">{rule.category || "general"}</Badge>
            <span
              className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.warning
              }`}
            >
              {severity}
            </span>
            <span className="font-mono text-[10px] text-white/30">
              p{rule.priority ?? 50}
            </span>
            <span
              className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                rule.is_active
                  ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-400"
                  : "border-white/10 bg-white/5 text-white/40"
              }`}
            >
              {rule.is_active ? "active" : "inactive"}
            </span>
          </div>
          <h1 className="break-words text-2xl font-semibold text-white">
            {rule.name}
          </h1>
          {rule.description && (
            <p className="mt-1 text-sm text-white/50">{rule.description}</p>
          )}
        </div>

        <Button type="button" variant="primary" asChild className="flex-shrink-0 gap-2">
          <Link href={`/projects/${slug}/rules/${ruleId}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit Rule
          </Link>
        </Button>
      </div>

      {/* Full instruction */}
      <GlassPanel className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-medium text-white">Instruction</h2>
        </div>
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/50 p-4 font-mono text-sm leading-relaxed text-white/80">
          {rule.content || "(no instruction)"}
        </pre>
      </GlassPanel>

      {/* Metadata */}
      <GlassPanel className="p-6">
        <h2 className="mb-4 text-sm font-medium text-white">Details</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.05] pb-2 sm:border-b-0 sm:pb-0">
            <dt className="text-white/40">Priority</dt>
            <dd className="font-mono text-white/80">{rule.priority ?? 50}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.05] pb-2 sm:border-b-0 sm:pb-0">
            <dt className="text-white/40">Status</dt>
            <dd className="text-white/80">
              {rule.is_active ? "Active" : "Inactive"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.05] pb-2 sm:border-b-0 sm:pb-0">
            <dt className="text-white/40">Category</dt>
            <dd className="text-white/80">{rule.category || "general"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.05] pb-2 sm:border-b-0 sm:pb-0">
            <dt className="text-white/40">Severity</dt>
            <dd className="text-white/80">{severity}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.05] pb-2 sm:border-b-0 sm:pb-0">
            <dt className="text-white/40">Pattern</dt>
            <dd className="break-all font-mono text-white/80">
              {rule.pattern || "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.05] pb-2 sm:border-b-0 sm:pb-0">
            <dt className="text-white/40">Source</dt>
            <dd className="text-white/80">{rule.source || "manual"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-white/40">Tags</dt>
            <dd className="flex flex-wrap justify-end gap-1.5">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-white/60">—</span>
              )}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-white/40">Created</dt>
            <dd className="text-white/80">{formatDate(rule.created_at)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-white/40">Last updated</dt>
            <dd className="text-white/80">{formatDate(rule.updated_at)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 sm:col-span-2">
            <dt className="text-white/40">Rule ID</dt>
            <dd className="break-all font-mono text-xs text-white/40">
              {rule.id}
            </dd>
          </div>
        </dl>
      </GlassPanel>
    </div>
  );
}
