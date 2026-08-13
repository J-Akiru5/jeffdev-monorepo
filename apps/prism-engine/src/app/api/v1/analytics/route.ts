import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";
import { TIER_LIMITS } from "@/lib/subscriptions";

const GPT4O_MINI_PER_1K_INPUT = 0.00015;
const GPT4O_MINI_PER_1K_OUTPUT = 0.0006;

function formatLimit(limit: number): number | string {
  return limit === -1 ? "unlimited" : limit;
}

interface TelemetryRow {
  tokenCount: number | null;
  isError: boolean | null;
  cacheHit: boolean | null;
  toolName: string | null;
  projectId: string | null;
  clientPlatform: string | null;
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const limits =
    TIER_LIMITS[auth.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const db = getPrismDb();
  const countOpts = { count: "exact" as const, head: true };

  const [
    { count: projectCount },
    { count: ruleCount },
    { count: componentCount },
    { count: generationCount },
    { data: telemetryRowsRaw },
  ] = await Promise.all([
    db.from("prism_projects").select("id", countOpts).eq("user_id", auth.userId),
    db.from("prism_rules").select("id", countOpts).eq("created_by", auth.userId),
    db.from("prism_components").select("id", countOpts).eq("user_id", auth.userId),
    db
      .from("prism_generations")
      .select("id", countOpts)
      .eq("user_id", auth.userId)
      .gte("created_at", monthStart.toISOString()),
    // Fetch this month's telemetry rows and aggregate in-process — the
    // volume here (one user, one month of MCP tool calls) is small enough
    // that this is simpler and just as fast as four separate aggregate
    // queries, and avoids needing a Postgres RPC function for GROUP BY.
    db
      .from("prism_telemetry")
      .select(
        "tokenCount:token_count, isError:is_error, cacheHit:cache_hit, toolName:tool_name, projectId:project_id, clientPlatform:client_platform",
      )
      .eq("user_id", auth.userId)
      .gte("timestamp", monthStart.toISOString()),
  ]);

  const telemetryRows = (telemetryRowsRaw ?? []) as TelemetryRow[];

  let totalTokens = 0;
  let totalCalls = 0;
  let errorCalls = 0;
  let cacheHitCalls = 0;
  const tokensByTool: Record<string, number> = {};
  const tokensByProject: Record<string, number> = {};
  const callsByPlatform: Record<string, number> = {};

  for (const row of telemetryRows) {
    const tokens = row.tokenCount ?? 0;
    totalTokens += tokens;
    totalCalls += 1;
    if (row.isError) errorCalls += 1;
    if (row.cacheHit) cacheHitCalls += 1;
    if (row.toolName) {
      tokensByTool[row.toolName] = (tokensByTool[row.toolName] || 0) + tokens;
    }
    if (row.projectId) {
      tokensByProject[row.projectId] =
        (tokensByProject[row.projectId] || 0) + tokens;
    }
    const platform = row.clientPlatform || "unknown";
    callsByPlatform[platform] = (callsByPlatform[platform] || 0) + 1;
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
      projects: { used: projectCount ?? 0, limit: formatLimit(limits.projects) },
      rules: { used: ruleCount ?? 0, limit: formatLimit(limits.rules) },
      components: {
        used: componentCount ?? 0,
        limit: formatLimit(limits.components),
      },
      aiGenerations: {
        used: generationCount ?? 0,
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

  const db = getPrismDb();
  const docs = events.map((e: Record<string, unknown>) => ({
    user_id: auth.userId,
    tool_name: e.toolName || "unknown",
    token_count: typeof e.tokenCount === "number" ? e.tokenCount : 0,
    byte_size: typeof e.byteSize === "number" ? e.byteSize : 0,
    is_error: !!e.isError,
    cache_hit: !!e.cacheHit,
    from_cache: !!e.fromCache,
    client_platform: e.clientPlatform || "unknown",
    project_id: e.projectId || null,
    model: e.model || null,
    timestamp: e.timestamp || new Date().toISOString(),
    ingested_at: new Date().toISOString(),
  }));

  await db.from("prism_telemetry").insert(docs);

  return successResponse({ ingested: docs.length });
}
