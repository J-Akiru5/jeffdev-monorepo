import { NextRequest } from "next/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

const UpdateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z
    .enum([
      "architecture",
      "styling",
      "security",
      "performance",
      "testing",
      "documentation",
      "custom",
    ])
    .optional(),
  content: z.string().min(1).optional(),
  priority: z.number().int().min(1).max(100).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  pattern: z.string().optional().nullable(),
  severity: z.enum(["error", "warning", "info"]).optional(),
});

function toColumns(data: z.infer<typeof UpdateRuleSchema>): Record<string, unknown> {
  const cols: Record<string, unknown> = {};
  if (data.name !== undefined) cols.name = data.name;
  if (data.description !== undefined) cols.description = data.description;
  if (data.category !== undefined) cols.category = data.category;
  if (data.content !== undefined) cols.content = data.content;
  if (data.priority !== undefined) cols.priority = data.priority;
  if (data.tags !== undefined) cols.tags = data.tags;
  if (data.isActive !== undefined) cols.is_active = data.isActive;
  if (data.pattern !== undefined) cols.pattern = data.pattern;
  if (data.severity !== undefined) cols.severity = data.severity;
  return cols;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid rule ID", 400);

  const db = getPrismDb();
  const { data: rule } = await db
    .from("prism_rules")
    .select(
      "_id:id, name, description, category, content, priority, tags, pattern, severity, isActive:is_active, createdAt:created_at, updatedAt:updated_at, skillsContent:skills_content, projectId:project_id, source, createdBy:created_by",
    )
    .eq("id", id)
    .eq("created_by", auth.userId)
    .maybeSingle();
  if (!rule) return errorResponse("Rule not found", 404);

  const detail = request.nextUrl.searchParams.get("detail");
  const isFull = detail === "full";

  const base = {
    id: rule._id.toString(),
    name: rule.name,
    description: rule.description,
    category: rule.category,
    content: rule.content,
    priority: rule.priority,
    tags: rule.tags || [],
    pattern: rule.pattern,
    severity: rule.severity,
    isActive: rule.isActive,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };

  if (!isFull) {
    const response = successResponse(base);
    response.headers.set("Cache-Control", "public, max-age=1800");
    response.headers.set("X-Cache-TTL", "1800");
    response.headers.set("Vary", "Authorization");
    return response;
  }

  const response = successResponse({
    ...base,
    skillsContent: rule.skillsContent || null,
    projectId: rule.projectId || null,
    source: rule.source || null,
    createdBy: rule.createdBy || null,
  });
  response.headers.set("Cache-Control", "public, max-age=1800");
  response.headers.set("X-Cache-TTL", "1800");
  response.headers.set("Vary", "Authorization");
  return response;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid rule ID", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = UpdateRuleSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  const db = getPrismDb();
  const { data: existing } = await db
    .from("prism_rules")
    .select(
      "_id:id, name, description, category, content, priority, tags, pattern, severity, isActive:is_active, createdAt:created_at",
    )
    .eq("id", id)
    .eq("created_by", auth.userId)
    .maybeSingle();
  if (!existing) return errorResponse("Rule not found", 404);

  const updatedAt = new Date().toISOString();
  // Re-scope by owner in the UPDATE itself (TOCTOU, solidity scan §3).
  await db
    .from("prism_rules")
    .update({ ...toColumns(parsed.data), updated_at: updatedAt })
    .eq("id", id)
    .eq("created_by", auth.userId);

  return successResponse({ id, ...existing, ...parsed.data, updatedAt });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid rule ID", 400);

  const db = getPrismDb();
  const { data: deleted } = await db
    .from("prism_rules")
    .delete()
    .eq("id", id)
    .eq("created_by", auth.userId)
    .select("id");
  if (!deleted || deleted.length === 0)
    return errorResponse("Rule not found", 404);

  return successResponse({ id, deleted: true });
}
