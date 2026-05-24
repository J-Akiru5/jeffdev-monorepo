import { NextRequest } from "next/server";
import { getCollection } from "@jeffdev/db/cosmos";
import { ObjectId } from "mongodb";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse("Invalid rule set ID", 400);

  const ruleSets = await getCollection("ruleSets");
  const ruleSet = await ruleSets.findOne({
    _id: new ObjectId(id),
    isPublic: true,
  });
  if (!ruleSet) return errorResponse("Rule set not found or not public", 404);

  const rules = await getCollection("rules");
  const installed: string[] = [];
  const ruleIds = (ruleSet.rules || []) as string[];

  for (const ruleId of ruleIds) {
    if (!ObjectId.isValid(ruleId)) continue;
    const sourceRule = await rules.findOne({ _id: new ObjectId(ruleId) });
    if (!sourceRule) continue;

    const now = new Date().toISOString();
    const doc = {
      name: sourceRule.name,
      description: sourceRule.description || "",
      category: sourceRule.category || "custom",
      content: sourceRule.content,
      priority: sourceRule.priority ?? 50,
      tags: sourceRule.tags || [],
      pattern: sourceRule.pattern,
      severity: sourceRule.severity || "warning",
      isActive: true,
      createdBy: auth.userId,
      sourceRuleSet: id,
      originalRuleId: ruleId,
      createdAt: now,
      updatedAt: now,
    };

    const existing = await rules.findOne({
      createdBy: auth.userId,
      originalRuleId: ruleId,
    });
    if (!existing) {
      const result = await rules.insertOne(doc);
      installed.push(result.insertedId.toString());
    }
  }

  return successResponse({
    ruleSetId: id,
    ruleSetName: ruleSet.name,
    installed: installed.length,
    totalRules: ruleIds.length,
  });
}
