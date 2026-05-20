import { NextRequest } from 'next/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { authenticate, errorResponse, successResponse } from '@/lib/api-auth';
import { TIER_LIMITS } from '@/lib/subscriptions';

const GPT4O_MINI_PER_1K_INPUT = 0.00015;
const GPT4O_MINI_PER_1K_OUTPUT = 0.0006;

function formatLimit(limit: number): number | string {
  return limit === -1 ? 'unlimited' : limit;
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const limits = TIER_LIMITS[auth.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [projects, rules, components, generations, telemetryColl] = await Promise.all([
    getCollection('projects'),
    getCollection('rules'),
    getCollection('components'),
    getCollection('generations'),
    getCollection('prism_telemetry'),
  ]);

  const [projectCount, ruleCount, componentCount, generationCount, telemetryEvents] = await Promise.all([
    projects.countDocuments({ userId: auth.userId }),
    rules.countDocuments({ createdBy: auth.userId }),
    components.countDocuments({ userId: auth.userId }),
    generations.countDocuments({ userId: auth.userId, createdAt: { $gte: monthStart.toISOString() } }),
    telemetryColl.find({ userId: auth.userId, timestamp: { $gte: monthStart.toISOString() } }).toArray(),
  ]);

  const telemetryEventsTyped = telemetryEvents as unknown as Array<{
    toolName: string;
    tokenCount: number;
    byteSize: number;
    isError: boolean;
    cacheHit?: boolean;
    fromCache?: boolean;
    clientPlatform?: string;
    projectId?: string;
    model?: string;
    timestamp: string;
  }>;

  const totalTokens = telemetryEventsTyped.reduce((sum, e) => sum + (e.tokenCount || 0), 0);
  const totalCalls = telemetryEventsTyped.length;
  const errorCalls = telemetryEventsTyped.filter((e) => e.isError).length;
  const cacheHitCalls = telemetryEventsTyped.filter((e) => e.cacheHit).length;

  const tokensByTool: Record<string, number> = {};
  const tokensByProject: Record<string, number> = {};
  const callsByPlatform: Record<string, number> = {};
  for (const e of telemetryEventsTyped) {
    tokensByTool[e.toolName] = (tokensByTool[e.toolName] || 0) + (e.tokenCount || 0);
    if (e.projectId) {
      tokensByProject[e.projectId] = (tokensByProject[e.projectId] || 0) + (e.tokenCount || 0);
    }
    const platform = e.clientPlatform || 'unknown';
    callsByPlatform[platform] = (callsByPlatform[platform] || 0) + 1;
  }
  }

  const costEstimate = (totalTokens / 1000) * (GPT4O_MINI_PER_1K_INPUT + GPT4O_MINI_PER_1K_OUTPUT) / 2;

  const nextMonthStart = new Date();
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
  nextMonthStart.setDate(1);
  nextMonthStart.setHours(0, 0, 0, 0);

  return successResponse({
    tier: auth.tier,
    usage: {
      projects: { used: projectCount, limit: formatLimit(limits.projects) },
      rules: { used: ruleCount, limit: formatLimit(limits.rules) },
      components: { used: componentCount, limit: formatLimit(limits.components) },
      aiGenerations: { used: generationCount, limit: formatLimit(limits.aiGenerations) },
    },
    telemetry: {
      tokensThisMonth: totalTokens,
      totalCalls,
      errorCalls,
      cacheHitCalls,
      cacheHitRate: totalCalls > 0 ? Math.round((cacheHitCalls / totalCalls) * 100) : 0,
      callsByPlatform: Object.keys(callsByPlatform).length > 0 ? callsByPlatform : undefined,
      tokensByTool,
      tokensByProject: Object.keys(tokensByProject).length > 0 ? tokensByProject : undefined,
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
    return errorResponse('Invalid JSON body', 400);
  }

  const events = Array.isArray(body) ? body : [body];
  if (events.length === 0) {
    return errorResponse('No events provided', 400);
  }

  const telemetryColl = await getCollection('prism_telemetry');
  const docs = events.map((e: Record<string, unknown>) => ({
    userId: auth.userId,
    toolName: e.toolName || 'unknown',
    tokenCount: typeof e.tokenCount === 'number' ? e.tokenCount : 0,
    byteSize: typeof e.byteSize === 'number' ? e.byteSize : 0,
    isError: !!e.isError,
    cacheHit: !!e.cacheHit,
    fromCache: !!e.fromCache,
    clientPlatform: e.clientPlatform || 'unknown',
    projectId: e.projectId || null,
    model: e.model || null,
    timestamp: e.timestamp || new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
  }));

  await telemetryColl.insertMany(docs);

  return successResponse({ ingested: docs.length });
}
