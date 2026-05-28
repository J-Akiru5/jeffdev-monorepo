"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const caseStudySchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable(),
  status: z.enum(["draft", "published"]),
});

export type CaseStudyInput = z.infer<typeof caseStudySchema>;

export async function createCaseStudy(
  input: CaseStudyInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = caseStudySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient.from("case_studies").insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      status: parsed.data.status,
    });

    if (error) throw error;

    revalidatePath("/admin/agency/case-studies");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create case study",
    };
  }
}

export async function updateCaseStudy(
  id: string,
  input: Partial<CaseStudyInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title !== undefined) updates.title = input.title;
    if (input.slug !== undefined) updates.slug = input.slug;
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = input.status;

    const { error } = await adminClient.from("case_studies").update(updates).eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/case-studies");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update case study",
    };
  }
}

export async function deleteCaseStudy(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const { error } = await adminClient.from("case_studies").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/agency/case-studies");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete case study",
    };
  }
}
