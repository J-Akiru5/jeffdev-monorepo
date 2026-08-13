import { NextRequest } from "next/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

const RULE_CATEGORIES = [
  "architecture",
  "styling",
  "security",
  "performance",
  "testing",
  "documentation",
  "custom",
] as const;

const CreateRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  category: z.enum(RULE_CATEGORIES).default("custom"),
  content: z.string().min(1),
  priority: z.number().int().min(1).max(100).optional().default(50),
  tags: z.array(z.string()).optional().default([]),
  pattern: z.string().optional(),
  severity: z.enum(["error", "warning", "info"]).optional().default("warning"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid project ID", 400);

  const db = getPrismDb();
  const { data: project } = await db
    .from("prism_projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!project) return errorResponse("Project not found", 404);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "50")),
  );
  const category = searchParams.get("category");

  let query = db
    .from("prism_rules")
    .select(
      "_id:id, name, description, category, content, priority, tags, pattern, severity, isActive:is_active, createdAt:created_at, updatedAt:updated_at",
      { count: "exact" },
    )
    .eq("project_id", project.id)
    .eq("is_active", true);
  if (
    category &&
    RULE_CATEGORIES.includes(category as (typeof RULE_CATEGORIES)[number])
  )
    query = query.eq("category", category);

  const { data: itemsRaw, count } = await query
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  const items = itemsRaw ?? [];
  const total = count ?? 0;

  return successResponse(
    items.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      description: r.description,
      category: r.category,
      content: r.content,
      priority: r.priority,
      tags: r.tags || [],
      pattern: r.pattern,
      severity: r.severity,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) },
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid project ID", 400);

  const db = getPrismDb();
  const { data: project } = await db
    .from("prism_projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!project) return errorResponse("Project not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = CreateRuleSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  const now = new Date().toISOString();
  const { data: inserted, error } = await db
    .from("prism_rules")
    .insert({
      project_id: project.id,
      created_by: auth.userId,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      content: parsed.data.content,
      priority: parsed.data.priority,
      tags: parsed.data.tags,
      pattern: parsed.data.pattern || null,
      severity: parsed.data.severity,
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return errorResponse("Failed to create rule", 500);
  }

  return successResponse(
    {
      id: inserted.id,
      ...parsed.data,
      projectId: project.id,
      createdBy: auth.userId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    { created: true },
  );
}
