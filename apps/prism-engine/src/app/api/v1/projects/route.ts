import { NextRequest } from "next/server";
import { getCollection } from "@syntaxure-labs/db/cosmos";
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

  const projects = await getCollection("projects");
  const query: Record<string, unknown> = { userId: auth.userId };
  if (stack && STACKS.includes(stack as (typeof STACKS)[number]))
    query.stack = stack;
  if (
    designSystem &&
    DESIGN_SYSTEMS.includes(designSystem as (typeof DESIGN_SYSTEMS)[number])
  )
    query.designSystem = designSystem;
  if (modifiedAfter) query.updatedAt = { $gte: modifiedAfter };

  const total = await projects.countDocuments(query);
  const items = await projects
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  const rules = await getCollection("rules");
  const videos = await getCollection("videos");

  const projectIds = items.map((p) => p._id.toString());

  // Batch count queries using aggregation instead of N+1
  const [ruleCounts, videoCounts] = await Promise.all([
    rules
      .aggregate([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: "$projectId", count: { $sum: 1 } } },
      ])
      .toArray(),
    videos
      .aggregate([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: "$projectId", count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const ruleCountMap = new Map(ruleCounts.map((r) => [r._id, r.count]));
  const videoCountMap = new Map(videoCounts.map((v) => [v._id, v.count]));

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

  const projects = await getCollection("projects");
  const existing = await projects.findOne({ userId: auth.userId, slug });
  if (existing)
    return errorResponse("A project with this name already exists", 409);

  const now = new Date().toISOString();
  const doc = {
    userId: auth.userId,
    name,
    slug,
    designSystem,
    stack,
    visibility: "private",
    createdAt: now,
    updatedAt: now,
  };

  const result = await projects.insertOne(doc);
  const response = successResponse(
    { id: result.insertedId.toString(), ...doc },
    { created: true },
  );
  Object.entries(
    getRateLimitHeaders(rl),
  ).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}
