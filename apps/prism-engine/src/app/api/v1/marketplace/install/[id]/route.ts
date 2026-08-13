import { NextRequest } from "next/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid rule set ID", 400);

  const db = getPrismDb();
  const { data: ruleSet } = await db
    .from("prism_rule_sets")
    .select("name, ruleIds:rule_ids")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();
  if (!ruleSet) return errorResponse("Rule set not found or not public", 404);

  const installed: string[] = [];
  const ruleIds = ((ruleSet.ruleIds || []) as string[]).filter((ruleId) =>
    isValidId(ruleId),
  );

  for (const ruleId of ruleIds) {
    const { data: sourceRule } = await db
      .from("prism_rules")
      .select("name, description, category, content, priority, tags, pattern, severity")
      .eq("id", ruleId)
      .maybeSingle();
    if (!sourceRule) continue;

    const { data: existing } = await db
      .from("prism_rules")
      .select("id")
      .eq("created_by", auth.userId)
      .eq("original_rule_id", ruleId)
      .maybeSingle();

    if (!existing) {
      const { data: inserted } = await db
        .from("prism_rules")
        .insert({
          name: sourceRule.name,
          description: sourceRule.description || "",
          category: sourceRule.category || "custom",
          content: sourceRule.content,
          priority: sourceRule.priority ?? 50,
          tags: sourceRule.tags || [],
          pattern: sourceRule.pattern,
          severity: sourceRule.severity || "warning",
          is_active: true,
          created_by: auth.userId,
          source_rule_set: id,
          original_rule_id: ruleId,
        })
        .select("id")
        .single();
      if (inserted) installed.push(inserted.id);
    }
  }

  return successResponse({
    ruleSetId: id,
    ruleSetName: ruleSet.name,
    installed: installed.length,
    totalRules: ruleIds.length,
  });
}
