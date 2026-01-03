"use server";

import { auth } from "@clerk/nextjs/server";
import { getCollection, ObjectId } from "@jeffdev/db";
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
 * Delete a project
 */
export async function deleteProject(projectId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const projectsCollection = await getCollection("projects");
  await projectsCollection.deleteOne({ 
    _id: new ObjectId(projectId), 
    userId // Ensure user owns the project
  });

  revalidatePath("/projects");
  redirect("/projects");
}
