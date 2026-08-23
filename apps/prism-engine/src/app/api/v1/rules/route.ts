import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

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
  projectId: z.string().optional(),
  pattern: z.string().optional(),
  severity: z.enum(["error", "warning", "info"]).optional().default("warning"),
  source: z.enum(["manual", "playwright", "repo"]).optional().default("manual"),
});

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = await checkRateLimit(`rules:list:${auth.userId}`, auth.tier);
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
  const detail = searchParams.get("detail");
  const modifiedAfter = searchParams.get("modifiedAfter");

  const db = getPrismDb();
  let query = db
    .from("prism_rules")
    .select(
      "_id:id, name, description, category, content, priority, tags, pattern, severity, source, isActive:is_active, createdAt:created_at, updatedAt:updated_at, skillsContent:skills_content, projectId:project_id",
      { count: "exact" },
    )
    .eq("created_by", auth.userId)
    .eq("is_active", active);
  if (category && (RULE_CATEGORIES as readonly string[]).includes(category))
    query = query.eq("category", category);
  if (tag) query = query.contains("tags", [tag]);
  if (search) query = query.ilike("name", `%${search}%`);
  if (modifiedAfter) query = query.gte("updated_at", modifiedAfter);

  const { data: itemsRaw, count } = await query
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  const items = itemsRaw ?? [];
  const total = count ?? 0;

  const isFull = detail === "full";
  const response = successResponse(
    items.map((r) => {
      const base: Record<string, unknown> = {
        id: r._id.toString(),
        name: r.name,
        description: r.description,
        category: r.category,
        content: r.content,
        priority: r.priority,
        tags: r.tags || [],
        pattern: r.pattern,
        severity: r.severity,
        source: r.source || "manual",
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
      if (isFull) {
        base.skillsContent = r.skillsContent || null;
        base.projectId = r.projectId || null;
      }
      return base;
    }),
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

  const rl = await checkRateLimit(`rules:create:${auth.userId}`, auth.tier);
  if (!rl.allowed)
    return errorResponse("Rate limit exceeded", 429, getRateLimitHeaders(rl));

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

  const db = getPrismDb();
  const now = new Date().toISOString();
  const { projectId, source, ...rest } = parsed.data;

  // Ownership guard: a caller may only attach a rule to a project it owns —
  // the pass endpoint serves rules by project_id, so an unverified projectId
  // would be a cross-tenant injection vector.
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
    .from("prism_rules")
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
    return errorResponse("Failed to create rule", 500);
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
