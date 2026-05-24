"use server";

import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@syntaxure-labs/db";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Zod Schema for creating/updating a skill
 */
const SkillStepSchema = z.object({
  title: z.string().min(1, "Step title is required").max(200),
  content: z.string().min(1, "Step content is required"),
});

const SkillSchema = z.object({
  name: z.string().min(2, "Skill name must be at least 2 characters").max(100),
  description: z.string().max(500).optional().default(""),
  category: z.string().min(1, "Category is required"),
  steps: z.array(SkillStepSchema).min(1, "At least one step is required"),
  tags: z
    .string()
    .optional()
    .transform((t) =>
      t
        ? t
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    ),
});

export type SkillActionState = {
  error?: {
    name?: string[];
    description?: string[];
    category?: string[];
    steps?: string[];
    general?: string;
  };
  success?: boolean;
} | null;

/**
 * Create a new skill
 */
export async function createSkill(
  _prevState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { general: "Unauthorized" } };
  }

  const userId = user.id;

  const projectSlug = formData.get("projectSlug") as string;
  const rawSteps = formData.get("steps") as string; // Will be passed as JSON string from a hidden field

  // Find project
  const projectsCollection = await getCollection("projects");
  const project = await projectsCollection.findOne({
    userId,
    slug: projectSlug,
  });

  if (!project) {
    return { error: { general: "Project not found" } };
  }

  let parsedSteps = [];
  try {
    parsedSteps = JSON.parse(rawSteps || "[]");
  } catch {
    return { error: { steps: ["Invalid steps format"] } };
  }

  // Validate input
  const parsed = SkillSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    steps: parsedSteps,
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, description, category, steps, tags } = parsed.data;

  // Create skill document
  const skillsCollection = await getCollection("skills");
  await skillsCollection.insertOne({
    projectId: project._id.toString(),
    createdBy: userId,
    name,
    description,
    category,
    steps,
    tags,
    source: "manual",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  revalidatePath(`/projects/${projectSlug}/skills`);
  revalidatePath(`/projects/${projectSlug}`);
  redirect(`/projects/${projectSlug}/skills`);
}
