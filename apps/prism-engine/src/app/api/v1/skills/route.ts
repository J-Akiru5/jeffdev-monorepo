import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

const SKILL_CATEGORIES = [
  "architecture",
  "workflow",
  "debugging",
  "deployment",
  "testing",
  "other",
] as const;

const SkillStepSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const CreateSkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  category: z.enum(SKILL_CATEGORIES).default("other"),
  steps: z.array(SkillStepSchema).min(1),
  tags: z.array(z.string()).optional().default([]),
  projectId: z.string().optional(),
  source: z
    .enum(["manual", "ai-generated", "video-extracted"])
    .optional()
    .default("manual"),
});

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = await checkRateLimit(`skills:list:${auth.userId}`, auth.tier);
  if (!rl.allowed) {
    return errorResponse("Rate limit exceeded", 429, getRateLimitHeaders(rl));
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const active = searchParams.get("active") !== "false";
  const search = searchParams.get("q");
  const projectId = searchParams.get("projectId");

  const db = getPrismDb();
  let query = db
    .from("prism_skills")
    .select(
      "_id:id, name, description, category, steps, tags, source, isActive:is_active, projectId:project_id, createdAt:created_at, updatedAt:updated_at",
      { count: "exact" },
    )
    .eq("created_by", auth.userId)
    .eq("is_active", active);
  if (category && (SKILL_CATEGORIES as readonly string[]).includes(category))
    query = query.eq("category", category);
  if (tag) query = query.contains("tags", [tag]);
  if (projectId) query = query.eq("project_id", projectId);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: itemsRaw, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  const items = itemsRaw ?? [];
  const total = count ?? 0;

  const response = successResponse(
    items.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      description: s.description,
      category: s.category,
      stepCount: (s.steps as unknown[] | null)?.length || 0,
      tags: s.tags || [],
      source: s.source || "manual",
      isActive: s.isActive,
      projectId: s.projectId || null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) },
  );

  Object.entries(
    getRateLimitHeaders(rl),
  ).forEach(([k, v]) => response.headers.set(k, v));
  response.headers.set("Cache-Control", "public, max-age=1800");
  response.headers.set("X-Cache-TTL", "1800");
  response.headers.set("Vary", "Authorization");
  return response;
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = await checkRateLimit(`skills:create:${auth.userId}`, auth.tier);
  if (!rl.allowed)
    return errorResponse("Rate limit exceeded", 429, getRateLimitHeaders(rl));

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = CreateSkillSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  const db = getPrismDb();
  const now = new Date().toISOString();
  const { projectId, source, ...rest } = parsed.data;

  // Ownership guard (same rationale as POST /v1/rules): only attach a skill
  // to a project the caller actually owns.
  if (projectId) {
    const { data: project } = await db
      .from("prism_projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (!project) return errorResponse("Project not found", 404);
  }

  const { data: inserted, error } = await db
    .from("prism_skills")
    .insert({
      ...rest,
      project_id: projectId || null,
      source: source || "manual",
      created_by: auth.userId,
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return errorResponse("Failed to create skill", 500);
  }

  const response = successResponse(
    {
      id: inserted.id,
      ...parsed.data,
      source: source || "manual",
      createdBy: auth.userId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    { created: true },
  );
  Object.entries(
    getRateLimitHeaders(rl),
  ).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}
