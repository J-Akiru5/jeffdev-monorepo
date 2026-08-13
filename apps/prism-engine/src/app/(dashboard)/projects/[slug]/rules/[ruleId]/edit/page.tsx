import { createClient } from "@/lib/supabase/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { notFound } from "next/navigation";
import { RuleEditForm } from "./rule-edit-form";

interface Props {
  params: Promise<{ slug: string; ruleId: string }>;
}

/**
 * Rule Edit Page
 * Edit rule content with "Enhance with AI" feature.
 */
export default async function RuleEditPage({ params }: Props) {
  const { slug, ruleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const userId = user.id;

  if (!isValidId(ruleId)) {
    notFound();
  }

  const db = getPrismDb();

  // Fetch project
  const { data: project } = await db
    .from("prism_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  // Fetch rule
  const { data: rule } = await db
    .from("prism_rules")
    .select("id, name, category, priority, content, description")
    .eq("id", ruleId)
    .eq("project_id", project.id)
    .maybeSingle();

  if (!rule) {
    notFound();
  }

  // Serialize rule for client component
  const serializedRule = {
    _id: rule.id,
    name: rule.name,
    category: rule.category || "general",
    priority: rule.priority || 50,
    content: rule.content || "",
    description: rule.description,
  };

  return <RuleEditForm rule={serializedRule} />;
}
