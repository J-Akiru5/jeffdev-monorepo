
"use server";

import { z } from "zod";
import { logError } from "@/lib/log-error";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { enhanceRuleWithAI } from "@/lib/gemini";

const UpdateRuleSchema = z.object({
  name: z
    .string()
    .min(2, "Rule name must be at least 2 characters")
    .max(100, "Rule name must be 100 characters or fewer"),
  description: z.string().max(500, "Description must be 500 characters or fewer"),
  category: z.string().min(1, "Category is required"),
  priority: z.coerce.number().min(1).max(100),
  severity: z.enum(["error", "warning", "info"]),
  content: z.string().min(10, "Rule content must be at least 10 characters"),
});

export type UpdateRuleState = {
  success?: boolean;
  error?:
    | string
    | {
        name?: string[];
        description?: string[];
        category?: string[];
        priority?: string[];
        severity?: string[];
        content?: string[];
        general?: string;
      };
} | null;

/**
 * Update a rule (all editable fields) — validated with zod; field errors come
 * back as an object (rendered inline) while general/string errors are toasted
 * by useActionFeedback.
 */
export async function updateRule(
  _prevState: UpdateRuleState,
  formData: FormData,
): Promise<UpdateRuleState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const userId = user.id;

  const ruleId = formData.get("ruleId") as string;
  const slug = formData.get("slug") as string;

  if (!ruleId || !slug || !isValidId(ruleId)) {
    return { error: "Missing required fields" };
  }

  const parsed = UpdateRuleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    category: formData.get("category"),
    priority: formData.get("priority"),
    severity: formData.get("severity"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, description, category, priority, severity, content } =
    parsed.data;

  try {
    const db = getPrismDb();

    // Verify the rule belongs to the user.
    // Note: the pre-migration Cosmos code checked a `userId` field here while
    // most of the rest of the app used `createdBy` for the same concept (see
    // PRISM_MIGRATION.md). Standardized on `created_by` during this port.
    const { data: rule } = await db
      .from("prism_rules")
      .select("id")
      .eq("id", ruleId)
      .eq("created_by", userId)
      .maybeSingle();

    if (!rule) {
      return { error: "Rule not found" };
    }

    // Update the rule — re-scope by owner in the UPDATE itself (TOCTOU-safe,
    // same pattern as the /api/v1/rules PATCH route).
    await db
      .from("prism_rules")
      .update({
        name,
        description: description.trim() || null,
        category,
        priority,
        severity,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ruleId)
      .eq("created_by", userId);

    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/rules/${ruleId}`);
    revalidatePath(`/projects/${slug}/rules/${ruleId}/edit`);

    return { success: true };
  } catch (error) {
    logError("app/(dashboard)/projects/[slug]/rules/[ruleId]/edit/actions", "Failed to update rule:", error);
    return { error: "Failed to update rule" };
  }
}

/**
 * Enhance a rule using Gemini AI
 */
export async function enhanceRule(
  ruleId: string,
  ruleName: string,
  ruleContent: string,
  category: string,
): Promise<{
  success: boolean;
  enhancedContent?: string;
  suggestions?: string[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await enhanceRuleWithAI(ruleName, ruleContent, category);

    return {
      success: true,
      enhancedContent: result.enhancedContent,
      suggestions: result.suggestions,
    };
  } catch (error) {
    logError("app/(dashboard)/projects/[slug]/rules/[ruleId]/edit/actions", "Failed to enhance rule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Enhancement failed",
    };
  }
}
