"use server";

import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * 🛡️ Zod Gate - Project Creation Schema
 */
const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name too long"),
  designSystem: z.enum([
    "jdstudio",
    "bare-minimum",
    "glassmorphic",
    "8bit-nostalgia",
    "keandrew",
    "custom",
  ]),
  stack: z.enum(["react", "nextjs", "react-native"]),
});

/**
 * Action state type for form handling
 */
export type CreateProjectState = {
  error?: {
    name?: string[];
    designSystem?: string[];
    stack?: string[];
  };
} | null;

/**
 * Create a new Prism Project
 * Uses the (prevState, formData) signature for useActionState compatibility.
 */
export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  // Validate input
  const parsed = CreateProjectSchema.safeParse({
    name: formData.get("name"),
    designSystem: formData.get("designSystem"),
    stack: formData.get("stack"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, designSystem, stack } = parsed.data;

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const db = getPrismDb();

  // Check for duplicate slug
  const { data: existing } = await db
    .from("prism_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return { error: { name: ["A project with this name already exists"] } };
  }

  // Create project row
  const { error } = await db.from("prism_projects").insert({
    user_id: userId,
    name,
    slug,
    design_system: designSystem,
    stack,
    visibility: "private",
  });

  if (error) {
    return { error: { name: ["Failed to create project"] } };
  }

  // Revalidate and redirect
  revalidatePath("/projects");
  redirect(`/projects/${slug}`);
}

/**
 * Action state type for project updates/deletes
 */
export type ProjectActionState = {
  error?: {
    name?: string[];
    stack?: string[];
    designSystem?: string[];
    general?: string;
  };
  success?: boolean;
} | null;

/**
 * Update a project
 */
export async function updateProject(
  _prevState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { general: "Unauthorized" } };
  }

  const userId = user.id;

  const slug = formData.get("slug") as string;
  const name = formData.get("name") as string;
  const stack = formData.get("stack") as string;
  const designSystem = formData.get("designSystem") as string;

  if (!slug) {
    return { error: { general: "Project not found" } };
  }

  const db = getPrismDb();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (name) updateData.name = name;
  if (stack) updateData.stack = stack;
  if (designSystem) updateData.design_system = designSystem;

  await db
    .from("prism_projects")
    .update(updateData)
    .eq("user_id", userId)
    .eq("slug", slug);

  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${slug}/settings`);

  return { success: true };
}

/**
 * Delete a project (useActionState compatible)
 */
export async function deleteProject(
  _prevState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { general: "Unauthorized" } };
  }

  const userId = user.id;

  const slug = formData.get("slug") as string;

  if (!slug) {
    return { error: { general: "Project not found" } };
  }

  const db = getPrismDb();

  // Find project first
  const { data: project } = await db
    .from("prism_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();

  if (!project) {
    return { error: { general: "Project not found" } };
  }

  // Delete associated rules, then the project
  // (prism_rules.project_id has ON DELETE SET NULL, so rules are deleted
  // explicitly first to match the original Cosmos cascade behavior)
  await db.from("prism_rules").delete().eq("project_id", project.id);
  await db.from("prism_projects").delete().eq("id", project.id).eq("user_id", userId);

  revalidatePath("/projects");
  redirect("/projects");
}

/**
 * Create a new rule for a project
 */
const CreateRuleSchema = z.object({
  name: z.string().min(2, "Rule name must be at least 2 characters").max(100),
  category: z.string().min(1, "Category is required"),
  content: z.string().min(10, "Rule content must be at least 10 characters"),
  priority: z.coerce.number().min(1).max(100).default(50),
  pattern: z.string().optional(), // Regex pattern for code validation
  severity: z.enum(["error", "warning", "info"]).default("warning"),
});

export type CreateRuleState = {
  error?: {
    name?: string[];
    category?: string[];
    content?: string[];
    priority?: string[];
    general?: string;
  };
  success?: boolean;
} | null;

export async function createRule(
  _prevState: CreateRuleState,
  formData: FormData,
): Promise<CreateRuleState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { general: "Unauthorized" } };
  }

  const userId = user.id;

  const projectSlug = formData.get("projectSlug") as string;

  const db = getPrismDb();

  // Find project
  const { data: project } = await db
    .from("prism_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", projectSlug)
    .maybeSingle();

  if (!project) {
    return { error: { general: "Project not found" } };
  }

  // Validate input
  const parsed = CreateRuleSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    content: formData.get("content"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, category, content, priority, pattern, severity } = parsed.data;

  // Create rule row
  await db.from("prism_rules").insert({
    project_id: project.id,
    created_by: userId,
    name,
    category,
    content,
    priority,
    pattern: pattern || null,
    severity: severity || "warning",
    is_active: true,
  });

  revalidatePath(`/projects/${projectSlug}`);
  redirect(`/projects/${projectSlug}`);
}
