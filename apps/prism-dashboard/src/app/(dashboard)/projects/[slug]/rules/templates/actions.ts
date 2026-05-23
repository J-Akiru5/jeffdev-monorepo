"use server";

import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@jeffdev/db";
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

  // Find project
  const projectsCollection = await getCollection("projects");
  const project = await projectsCollection.findOne({
    userId,
    slug: projectSlug,
  });

  if (!project) {
    return { error: "Project not found" };
  }

  // Find template
  const template = ruleTemplates.find((t) => t.id === templateId);
  if (!template) {
    return { error: "Template not found" };
  }

  // Insert rules
  const rulesCollection = await getCollection("rules");
  const now = new Date().toISOString();

  const rulesToInsert = template.rules.map((rule) => ({
    projectId: project._id.toString(),
    createdBy: userId,
    name: rule.name,
    category: rule.category,
    content: rule.content,
    priority: rule.priority,
    pattern: rule.pattern || null,
    severity: rule.severity || "warning",
    source: "template",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));

  try {
    await rulesCollection.insertMany(rulesToInsert);
  } catch {
    return { error: "Failed to install template rules" };
  }

  revalidatePath(`/projects/${projectSlug}`);
  redirect(`/projects/${projectSlug}`);
}
