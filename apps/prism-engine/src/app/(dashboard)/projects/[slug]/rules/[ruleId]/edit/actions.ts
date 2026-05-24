"use server";

import { getCollection, ObjectId } from "@syntaxure-labs/db";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { enhanceRuleWithAI } from "@/lib/gemini";

interface ActionState {
  success?: boolean;
  error?: string;
}

/**
 * Update a rule's content
 */
export async function updateRule(
  prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const userId = user.id;

  const ruleId = formData.get("ruleId") as string;
  const content = formData.get("content") as string;
  const slug = formData.get("slug") as string;

  if (!ruleId || !content) {
    return { error: "Missing required fields" };
  }

  try {
    const rulesCollection = await getCollection("rules");

    // Verify the rule belongs to the user
    const rule = await rulesCollection.findOne({
      _id: new ObjectId(ruleId),
      userId,
    });

    if (!rule) {
      return { error: "Rule not found" };
    }

    // Update the rule
    await rulesCollection.updateOne(
      { _id: new ObjectId(ruleId) },
      {
        $set: {
          content,
          updatedAt: new Date(),
        },
      },
    );

    revalidatePath(`/projects/${slug}`);
    revalidatePath(`/projects/${slug}/rules/${ruleId}/edit`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update rule:", error);
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
    console.error("Failed to enhance rule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Enhancement failed",
    };
  }
}
