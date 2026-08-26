/**
 * Engine health-check aggregation (Phase 5).
 *
 * Split out of the /api/health route so the degraded-flip behaviour is
 * unit-testable without booting Next.js or touching real services.
 */

import { getPrismDb } from "@syntaxure-labs/db/prism";
import { pingRedis } from "@syntaxure/redis";

export interface CheckResult {
  ok: boolean;
  latencyMs: number;
}

export interface RedisCheckResult extends CheckResult {
  configured: boolean;
}

export type HealthStatus = "ok" | "degraded";

export interface HealthReport {
  status: HealthStatus;
  service: "prism-engine";
  version: string;
  timestamp: string;
  checks: {
    supabase: CheckResult;
    redis: { ok: boolean; configured: boolean; latencyMs: number };
  };
  memory: { heapUsedMb: number; heapTotalMb: number };
  totalLatencyMs: number;
}

/** Unconfigured Redis passes (feature absent); unreachable fails. */
export function aggregateStatus(
  supabaseOk: boolean,
  redisConfigured: boolean,
  redisOk: boolean,
): HealthStatus {
  const redisEffective = !redisConfigured || redisOk;
  return supabaseOk && redisEffective ? "ok" : "degraded";
}

export async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const db = getPrismDb();
    const { error } = await db
      .from("user_profiles")
      .select("id", { count: "exact", head: true });
    return { ok: !error, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

export async function checkRedis(): Promise<RedisCheckResult> {
  const start = Date.now();
  try {
    const result = await pingRedis();
    return { ...result, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, configured: false, latencyMs: Date.now() - start };
  }
}

export async function buildHealthReport(
  version = "1.2.0",
): Promise<HealthReport> {
  const started = Date.now();
  const [supabase, redis] = await Promise.all([checkSupabase(), checkRedis()]);
  const mem = process.memoryUsage();

  return {
    status: aggregateStatus(supabase.ok, redis.configured, redis.ok),
    service: "prism-engine",
    version,
    timestamp: new Date().toISOString(),
    checks: {
      supabase,
      redis: {
        ok: !redis.configured || redis.ok,
        configured: redis.configured,
        latencyMs: redis.latencyMs,
      },
    },
    memory: {
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    },
    totalLatencyMs: Date.now() - started,
  };
}
