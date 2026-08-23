import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

const STACKS = ["react", "nextjs", "react-native"] as const;
const DESIGN_SYSTEMS = [
  "jdstudio",
  "bare-minimum",
  "glassmorphic",
  "8bit-nostalgia",
  "keandrew",
  "custom",
] as const;

const CreateProjectSchema = z.object({
  name: z.string().min(2).max(100),
  designSystem: z.enum(DESIGN_SYSTEMS),
  stack: z.enum(STACKS),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = await checkRateLimit(`projects:list:${auth.userId}`, auth.tier);
  if (!rl.allowed)
    return errorResponse("Rate limit exceeded", 429, getRateLimitHeaders(rl));

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );
  const stack = searchParams.get("stack");
  const designSystem = searchParams.get("designSystem");
  const modifiedAfter = searchParams.get("modifiedAfter");

  const db = getPrismDb();
  let query = db
    .from("prism_projects")
    .select(
      "_id:id, name, slug, designSystem:design_system, stack, createdAt:created_at, updatedAt:updated_at",
      { count: "exact" },
    )
    .eq("user_id", auth.userId);
  if (stack && STACKS.includes(stack as (typeof STACKS)[number]))
    query = query.eq("stack", stack);
  if (
    designSystem &&
    DESIGN_SYSTEMS.includes(designSystem as (typeof DESIGN_SYSTEMS)[number])
  )
    query = query.eq("design_system", designSystem);
  if (modifiedAfter) query = query.gte("updated_at", modifiedAfter);

  const { data: itemsRaw, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  const items = itemsRaw ?? [];
  const total = count ?? 0;

  const projectIds = items.map((p) => p._id.toString());

  // Batch count rules/videos per project (avoids N+1) via GROUP BY-equivalent
  // aggregation. Postgres/PostgREST has no `.groupBy()` helper, so this is
  // done with one query per related table and reduced in-process — the row
  // volume here (rules/videos for a page of <=50 projects) is small.
  const [{ data: ruleRows }, { data: videoRows }] =
    projectIds.length > 0
      ? await Promise.all([
          db.from("prism_rules").select("project_id").in("project_id", projectIds),
          db.from("prism_videos").select("project_id").in("project_id", projectIds),
        ])
      : [{ data: [] }, { data: [] }];

  const ruleCountMap = new Map<string, number>();
  for (const r of ruleRows ?? []) {
    const pid = r.project_id as string;
    ruleCountMap.set(pid, (ruleCountMap.get(pid) || 0) + 1);
  }
  const videoCountMap = new Map<string, number>();
  for (const v of videoRows ?? []) {
    const pid = v.project_id as string;
    videoCountMap.set(pid, (videoCountMap.get(pid) || 0) + 1);
  }

  const enriched = items.map((p) => {
    const projectId = p._id.toString();
    return {
      id: projectId,
      name: p.name,
      slug: p.slug,
      designSystem: p.designSystem,
      stack: p.stack,
      ruleCount: ruleCountMap.get(projectId) || 0,
      videoCount: videoCountMap.get(projectId) || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  const response = successResponse(enriched, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
  Object.entries(
    getRateLimitHeaders(rl),
  ).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = await checkRateLimit(`projects:create:${auth.userId}`, auth.tier);
  if (!rl.allowed)
    return errorResponse("Rate limit exceeded", 429, getRateLimitHeaders(rl));

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  const { name, designSystem, stack } = parsed.data;
  const slug = slugify(name);

  const db = getPrismDb();
  const { data: existing } = await db
    .from("prism_projects")
    .select("id")
    .eq("user_id", auth.userId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing)
    return errorResponse("A project with this name already exists", 409);

  const now = new Date().toISOString();
  const { data: inserted, error } = await db
    .from("prism_projects")
    .insert({
      user_id: auth.userId,
      name,
      slug,
      design_system: designSystem,
      stack,
      visibility: "private",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return errorResponse("Failed to create project", 500);
  }

  const response = successResponse(
    {
      id: inserted.id,
      userId: auth.userId,
      name,
      slug,
      designSystem,
      stack,
      visibility: "private",
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
