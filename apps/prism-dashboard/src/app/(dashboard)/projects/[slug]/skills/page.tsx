import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@jeffdev/db";
import { ArrowLeft, BookOpen, Sparkles, ListOrdered } from "lucide-react";
import { SkillsList, type SkillItem } from "./skills-list";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Project Skills Page
 * Lists all skills/workflows for a specific project.
 */
export default async function ProjectSkillsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const userId = user.id;

  // Fetch project
  const projectsCollection = await getCollection("projects");
  const project = await projectsCollection.findOne({ userId, slug });

  if (!project) {
    notFound();
  }

  // Fetch associated skills
  const skillsCollection = await getCollection("skills");
  const skills = await skillsCollection
    .find({ projectId: project._id.toString() })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href={`/projects/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-cyan-400" />
            Skill Studio
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Teach your AI assistant how to perform specific workflows in{" "}
            {project.name}.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${slug}/skills/generate`}
            className="inline-flex items-center gap-2 rounded-md border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/20 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Generate
          </Link>
          <Link
            href={`/projects/${slug}/skills/new`}
            className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            <ListOrdered className="h-4 w-4" />
            Create Manual
          </Link>
        </div>
      </div>

      {/* Skills List — interactive client component */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SkillsList
            skills={skills.map(
              (s): SkillItem => ({
                id: (s._id as { toString: () => string }).toString(),
                name: (s.name as string) || "Untitled Skill",
                category: (s.category as string) || "other",
                description: (s.description as string) || "",
                stepCount: (s.steps as unknown[])?.length || 0,
                isActive: s.isActive !== false,
                source: (s.source as string) || "manual",
              }),
            )}
            projectSlug={slug}
          />
        </div>

        <div>
          <div className="rounded-md border border-white/[0.05] bg-white/[0.02] p-5 sticky top-24">
            <h3 className="text-sm font-medium text-white mb-2">
              What is a Skill?
            </h3>
            <p className="text-xs text-white/60 mb-4 leading-relaxed">
              Rules say <strong>what</strong> constraints to follow. Skills say{" "}
              <strong>how</strong> to perform a task step-by-step.
            </p>
            <p className="text-xs text-white/60 leading-relaxed">
              When using the MCP server, the AI can call `list_skills` to see
              what workflows are available, and `get_skill` to learn exactly how
              to execute one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
