import { NextRequest } from "next/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  designSystem: z
    .enum([
      "jdstudio",
      "bare-minimum",
      "glassmorphic",
      "8bit-nostalgia",
      "keandrew",
      "custom",
    ])
    .optional(),
  stack: z.enum(["react", "nextjs", "react-native"]).optional(),
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
    .select(
      "_id:id, name, slug, designSystem:design_system, stack, createdAt:created_at, updatedAt:updated_at",
    )
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!project) return errorResponse("Project not found", 404);

  const projectId = project._id.toString();
  const countOpts = { count: "exact" as const, head: true };
  const [{ count: ruleCount }, { count: videoCount }] = await Promise.all([
    db.from("prism_rules").select("id", countOpts).eq("project_id", projectId),
    db.from("prism_videos").select("id", countOpts).eq("project_id", projectId),
  ]);

  return successResponse({
    id: projectId,
    name: project.name,
    slug: project.slug,
    designSystem: project.designSystem,
    stack: project.stack,
    ruleCount: ruleCount ?? 0,
    videoCount: videoCount ?? 0,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid project ID", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = UpdateProjectSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  const db = getPrismDb();
  const { data: existing } = await db
    .from("prism_projects")
    .select("_id:id, name, slug, designSystem:design_system, stack, createdAt:created_at")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!existing) return errorResponse("Project not found", 404);

  const updatedAt = new Date().toISOString();
  const columns: Record<string, unknown> = { updated_at: updatedAt };
  if (parsed.data.name !== undefined) columns.name = parsed.data.name;
  if (parsed.data.stack !== undefined) columns.stack = parsed.data.stack;
  if (parsed.data.designSystem !== undefined)
    columns.design_system = parsed.data.designSystem;

  // Re-scope by owner in the UPDATE itself — the earlier SELECT no longer
  // proves ownership by the time the write lands (TOCTOU, solidity scan §3).
  await db
    .from("prism_projects")
    .update(columns)
    .eq("id", id)
    .eq("user_id", auth.userId);

  return successResponse({ id, ...existing, ...parsed.data, updatedAt });
}

export async function DELETE(
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

  const projectId = project.id;
  await Promise.all([
    db.from("prism_rules").delete().eq("project_id", projectId),
    db.from("prism_projects").delete().eq("id", id),
  ]);

  return successResponse({ id, deleted: true });
}
