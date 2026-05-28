import { NextRequest } from "next/server";
import { getCollection } from "@syntaxure-labs/db/cosmos";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";
import { TIER_LIMITS } from "@/lib/subscriptions";

const GPT4O_MINI_PER_1K_INPUT = 0.00015;
const GPT4O_MINI_PER_1K_OUTPUT = 0.0006;

function formatLimit(limit: number): number | string {
  return limit === -1 ? "unlimited" : limit;
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const limits =
    TIER_LIMITS[auth.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [projects, rules, components, generations, telemetryColl] =
    await Promise.all([
      getCollection("projects"),
      getCollection("rules"),
      getCollection("components"),
      getCollection("generations"),
      getCollection("prism_telemetry"),
    ]);

  const [
    projectCount,
    ruleCount,
    componentCount,
    generationCount,
    telemetryAgg,
    toolBreakdown,
    projectBreakdown,
    platformBreakdown,
  ] = await Promise.all([
    projects.countDocuments({ userId: auth.userId }),
    rules.countDocuments({ createdBy: auth.userId }),
    components.countDocuments({ userId: auth.userId }),
    generations.countDocuments({
      userId: auth.userId,
      createdAt: { $gte: monthStart.toISOString() },
    }),
    // Use aggregation pipeline instead of fetching all documents
    telemetryColl
      .aggregate([
        {
          $match: {
            userId: auth.userId,
            timestamp: { $gte: monthStart.toISOString() },
          },
        },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: { $ifNull: ["$tokenCount", 0] } },
            totalCalls: { $sum: 1 },
            errorCalls: { $sum: { $cond: ["$isError", 1, 0] } },
            cacheHitCalls: { $sum: { $cond: ["$cacheHit", 1, 0] } },
          },
        },
      ])
      .toArray(),
    // Aggregate tokens by tool
    telemetryColl
      .aggregate([
        {
          $match: {
            userId: auth.userId,
            timestamp: { $gte: monthStart.toISOString() },
          },
        },
        {
          $group: {
            _id: "$toolName",
            tokens: { $sum: { $ifNull: ["$tokenCount", 0] } },
          },
        },
      ])
      .toArray(),
    // Aggregate tokens by project
    telemetryColl
      .aggregate([
        {
          $match: {
            userId: auth.userId,
            timestamp: { $gte: monthStart.toISOString() },
            projectId: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$projectId",
            tokens: { $sum: { $ifNull: ["$tokenCount", 0] } },
          },
        },
      ])
      .toArray(),
    // Aggregate calls by platform
    telemetryColl
      .aggregate([
        {
          $match: {
            userId: auth.userId,
            timestamp: { $gte: monthStart.toISOString() },
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$clientPlatform", "unknown"] },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
  ]);

  const agg = (telemetryAgg as unknown as Array<{
    totalTokens: number;
    totalCalls: number;
    errorCalls: number;
    cacheHitCalls: number;
  }>)[0];

  const totalTokens = agg?.totalTokens || 0;
  const totalCalls = agg?.totalCalls || 0;
  const errorCalls = agg?.errorCalls || 0;
  const cacheHitCalls = agg?.cacheHitCalls || 0;

  const tokensByTool: Record<string, number> = {};
  for (const t of toolBreakdown as unknown as Array<{ _id: string; tokens: number }>) {
    if (t._id) tokensByTool[t._id] = t.tokens;
  }

  const tokensByProject: Record<string, number> = {};
  for (const p of projectBreakdown as unknown as Array<{ _id: string; tokens: number }>) {
    if (p._id) tokensByProject[p._id] = p.tokens;
  }

  const callsByPlatform: Record<string, number> = {};
  for (const p of platformBreakdown as unknown as Array<{ _id: string; count: number }>) {
    if (p._id) callsByPlatform[p._id] = p.count;
  }

  const costEstimate =
    ((totalTokens / 1000) *
      (GPT4O_MINI_PER_1K_INPUT + GPT4O_MINI_PER_1K_OUTPUT)) /
    2;

  const nextMonthStart = new Date();
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
  nextMonthStart.setDate(1);
  nextMonthStart.setHours(0, 0, 0, 0);

  return successResponse({
    tier: auth.tier,
    usage: {
      projects: { used: projectCount, limit: formatLimit(limits.projects) },
      rules: { used: ruleCount, limit: formatLimit(limits.rules) },
      components: {
        used: componentCount,
        limit: formatLimit(limits.components),
      },
      aiGenerations: {
        used: generationCount,
        limit: formatLimit(limits.aiGenerations),
      },
    },
    telemetry: {
      tokensThisMonth: totalTokens,
      totalCalls,
      errorCalls,
      cacheHitCalls,
      cacheHitRate:
        totalCalls > 0 ? Math.round((cacheHitCalls / totalCalls) * 100) : 0,
      callsByPlatform:
        Object.keys(callsByPlatform).length > 0 ? callsByPlatform : undefined,
      tokensByTool,
      tokensByProject:
        Object.keys(tokensByProject).length > 0 ? tokensByProject : undefined,
      costEstimate: Math.round(costEstimate * 100) / 100,
    },
    resetDate: nextMonthStart.toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const events = Array.isArray(body) ? body : [body];
  if (events.length === 0) {
    return errorResponse("No events provided", 400);
  }

  const telemetryColl = await getCollection("prism_telemetry");
  const docs = events.map((e: Record<string, unknown>) => ({
    userId: auth.userId,
    toolName: e.toolName || "unknown",
    tokenCount: typeof e.tokenCount === "number" ? e.tokenCount : 0,
    byteSize: typeof e.byteSize === "number" ? e.byteSize : 0,
    isError: !!e.isError,
    cacheHit: !!e.cacheHit,
    fromCache: !!e.fromCache,
    clientPlatform: e.clientPlatform || "unknown",
    projectId: e.projectId || null,
    model: e.model || null,
    timestamp: e.timestamp || new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
  }));

  await telemetryColl.insertMany(docs);

  return successResponse({ ingested: docs.length });
}
