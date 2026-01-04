"use server";

import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
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
  designSystem: z.enum(["jdstudio", "bare-minimum", "glassmorphic", "8bit-nostalgia", "keandrew", "custom"]),
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
  formData: FormData
): Promise<CreateProjectState> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

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

  // Check for duplicate slug
  const projectsCollection = await getCollection("projects");
  const existing = await projectsCollection.findOne({ userId, slug });
  
  if (existing) {
    return { error: { name: ["A project with this name already exists"] } };
  }

  // Create project document
  const project = {
    userId,
    name,
    slug,
    designSystem,
    stack,
    visibility: "private",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await projectsCollection.insertOne(project);

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
  formData: FormData
): Promise<ProjectActionState> {
  const { userId } = await auth();
  
  if (!userId) {
    return { error: { general: "Unauthorized" } };
  }

  const slug = formData.get("slug") as string;
  const name = formData.get("name") as string;
  const stack = formData.get("stack") as string;
  const designSystem = formData.get("designSystem") as string;

  if (!slug) {
    return { error: { general: "Project not found" } };
  }

  const projectsCollection = await getCollection("projects");

  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (name) updateData.name = name;
  if (stack) updateData.stack = stack;
  if (designSystem) updateData.designSystem = designSystem;

  await projectsCollection.updateOne(
    { userId, slug },
    { $set: updateData }
  );

  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${slug}/settings`);

  return { success: true };
}

/**
 * Delete a project (useActionState compatible)
 */
export async function deleteProject(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const { userId } = await auth();

  if (!userId) {
    return { error: { general: "Unauthorized" } };
  }

  const slug = formData.get("slug") as string;

  if (!slug) {
    return { error: { general: "Project not found" } };
  }

  const projectsCollection = await getCollection("projects");
  const rulesCollection = await getCollection("rules");

  // Find project first
  const project = await projectsCollection.findOne({ userId, slug });

  if (!project) {
    return { error: { general: "Project not found" } };
  }

  // Delete associated rules
  await rulesCollection.deleteMany({ projectId: project._id.toString() });

  // Delete project
  await projectsCollection.deleteOne({ _id: project._id, userId });

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
  formData: FormData
): Promise<CreateRuleState> {
  const { userId } = await auth();

  if (!userId) {
    return { error: { general: "Unauthorized" } };
  }

  const projectSlug = formData.get("projectSlug") as string;

  // Find project
  const projectsCollection = await getCollection("projects");
  const project = await projectsCollection.findOne({ userId, slug: projectSlug });

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

  const { name, category, content, priority } = parsed.data;

  // Create rule document
  const rulesCollection = await getCollection("rules");
  await rulesCollection.insertOne({
    projectId: project._id.toString(),
    createdBy: userId,
    name,
    category,
    content,
    priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  revalidatePath(`/projects/${projectSlug}`);
  redirect(`/projects/${projectSlug}`);
}
