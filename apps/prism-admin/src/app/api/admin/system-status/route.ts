/**
 * GET /api/admin/system-status — Phase 5 monitoring.
 *
 * Aggregated, REAL subsystem status for the admin dashboards:
 *  - supabase: lightweight head-count query on prism DB (admin-local)
 *  - redis:    ping via @syntaxure/redis (rate-limiter dependency)
 *  - engine:   fetches prism-engine /api/health (reachability + its own
 *              supabase/redis verdicts)
 *
 * Admin-gated (roles match the admin layout gate). Never throws — every
 * failure degrades into the payload so the UI can say something other than
 * green.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { pingRedis } from "@syntaxure/redis";

const ENGINE_HEALTH_URL =
  process.env.ENGINE_HEALTH_URL || "https://prism.syntaxure.dev/api/health";

interface CheckResult {
  ok: boolean;
  latencyMs: number;
  detail?: string;
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const db = getPrismDb();
    const { error } = await db
      .from("prism_projects")
      .select("id", { count: "exact", head: true });
    return {
      ok: !error,
      latencyMs: Date.now() - start,
      ...(error ? { detail: error.message } : {}),
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : "unreachable",
    };
  }
}

async function checkEngine(): Promise<
  CheckResult & {
    status?: string;
    subChecks?: Record<string, unknown>;
  }
> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(ENGINE_HEALTH_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return {
        ok: false,
        latencyMs,
        detail: `health endpoint returned ${res.status}`,
      };
    }
    const data = (await res.json()) as {
      status?: string;
      checks?: Record<string, unknown>;
    };
    return {
      ok: data.status === "ok",
      latencyMs,
      ...(data.status ? { status: data.status } : {}),
      subChecks: (data.checks ?? {}) as Record<string, unknown>,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      detail:
        err instanceof Error && err.name === "AbortError"
          ? "timeout after 5s"
          : err instanceof Error
            ? err.message
            : "unreachable",
    };
  }
}

export async function GET(_request: NextRequest) {
  // Auth gate mirrors the admin layout role check.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getPrismDb();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  if (!role || !["founder", "admin", "manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const started = Date.now();
  const [supabaseCheck, redisResult, engine] = await Promise.all([
    checkSupabase(),
    pingRedis().catch(() => ({
      ok: false,
      configured: false,
      latencyMs: Date.now() - started,
    })),
    checkEngine(),
  ]);

  const redisConfigured =
    typeof redisResult.configured === "boolean"
      ? redisResult.configured
      : false;
  const redisOk = !redisConfigured || redisResult.ok;

  const failing = [
    !supabaseCheck.ok && "supabase",
    redisConfigured && !redisResult.ok && "redis",
    !engine.ok && "engine",
  ].filter(Boolean) as string[];

  const aggregate =
    failing.includes("supabase") || failing.includes("engine")
      ? "down"
      : failing.length > 0
        ? "degraded"
        : "operational";

  return NextResponse.json(
    {
      status: aggregate,
      timestamp: new Date().toISOString(),
      totalLatencyMs: Date.now() - started,
      checks: {
        supabase: supabaseCheck,
        redis: {
          ok: redisOk,
          configured: redisConfigured,
          latencyMs: redisResult.latencyMs ?? 0,
        },
        engine: {
          ok: engine.ok,
          latencyMs: engine.latencyMs,
          ...(engine.status ? { status: engine.status } : {}),
          ...(engine.detail ? { detail: engine.detail } : {}),
        },
      },
      ...(failing.length > 0 ? { failing } : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
