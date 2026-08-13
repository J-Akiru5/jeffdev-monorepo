import { NextRequest } from "next/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

const SkillStepSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const UpdateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z
    .enum([
      "architecture",
      "workflow",
      "debugging",
      "deployment",
      "testing",
      "other",
    ])
    .optional(),
  steps: z.array(SkillStepSchema).min(1).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

function toColumns(data: z.infer<typeof UpdateSkillSchema>): Record<string, unknown> {
  const cols: Record<string, unknown> = {};
  if (data.name !== undefined) cols.name = data.name;
  if (data.description !== undefined) cols.description = data.description;
  if (data.category !== undefined) cols.category = data.category;
  if (data.steps !== undefined) cols.steps = data.steps;
  if (data.tags !== undefined) cols.tags = data.tags;
  if (data.isActive !== undefined) cols.is_active = data.isActive;
  return cols;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid skill ID", 400);

  const db = getPrismDb();
  const { data: skill } = await db
    .from("prism_skills")
    .select(
      "projectId:project_id, name, description, category, steps, tags, isActive:is_active, source, createdBy:created_by, createdAt:created_at, updatedAt:updated_at",
    )
    .eq("id", id)
    .eq("created_by", auth.userId)
    .maybeSingle();
  if (!skill) return errorResponse("Skill not found", 404);

  const response = successResponse({
    id,
    projectId: skill.projectId || null,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    steps: skill.steps || [],
    tags: skill.tags || [],
    isActive: skill.isActive,
    source: skill.source || "manual",
    createdBy: skill.createdBy || null,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
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
  if (!isValidId(id)) return errorResponse("Invalid skill ID", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = UpdateSkillSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  const db = getPrismDb();
  const { data: existing } = await db
    .from("prism_skills")
    .select("name, description, category, steps, tags, isActive:is_active")
    .eq("id", id)
    .eq("created_by", auth.userId)
    .maybeSingle();
  if (!existing) return errorResponse("Skill not found", 404);

  const updatedAt = new Date().toISOString();
  await db
    .from("prism_skills")
    .update({ ...toColumns(parsed.data), updated_at: updatedAt })
    .eq("id", id);

  return successResponse({ id, ...existing, ...parsed.data, updatedAt });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid skill ID", 400);

  const db = getPrismDb();
  const { data: deleted } = await db
    .from("prism_skills")
    .delete()
    .eq("id", id)
    .eq("created_by", auth.userId)
    .select("id");
  if (!deleted || deleted.length === 0)
    return errorResponse("Skill not found", 404);

  return successResponse({ id, deleted: true });
}
