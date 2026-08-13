"use server";

import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ruleTemplates } from "@/data/rule-templates";

export type InstallTemplateState = {
  error?: string;
  success?: boolean;
} | null;

export async function installTemplate(
  _prevState: InstallTemplateState,
  formData: FormData,
): Promise<InstallTemplateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const userId = user.id;

  const projectSlug = formData.get("projectSlug") as string;
  const templateId = formData.get("templateId") as string;

  if (!projectSlug || !templateId) {
    return { error: "Missing required fields" };
  }

  const db = getPrismDb();

  // Find project
  const { data: project } = await db
    .from("prism_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", projectSlug)
    .maybeSingle();

  if (!project) {
    return { error: "Project not found" };
  }

  // Find template
  const template = ruleTemplates.find((t) => t.id === templateId);
  if (!template) {
    return { error: "Template not found" };
  }

  // Insert rules
  const rulesToInsert = template.rules.map((rule) => ({
    project_id: project.id,
    created_by: userId,
    name: rule.name,
    category: rule.category,
    content: rule.content,
    priority: rule.priority,
    pattern: rule.pattern || null,
    severity: rule.severity || "warning",
    source: "template",
    is_active: true,
  }));

  const { error } = await db.from("prism_rules").insert(rulesToInsert);
  if (error) {
    return { error: "Failed to install template rules" };
  }

  revalidatePath(`/projects/${projectSlug}`);
  redirect(`/projects/${projectSlug}`);
}
