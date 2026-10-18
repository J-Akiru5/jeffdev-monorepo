import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/health
 * ---------------
 * Deep health check: verifies a database round-trip and reports which
 * integrations are configured (booleans only — never values). Returns 503
 * when the database is unreachable so uptime monitors catch degradation.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  let db: { ok: boolean; latencyMs: number; error?: string };
  try {
    const admin = getAdminClient();
    const dbStartedAt = Date.now();
    const { error } = await admin
      .from("workspaces")
      .select("id", { count: "exact", head: true });
    db = {
      ok: !error,
      latencyMs: Date.now() - dbStartedAt,
      ...(error ? { error: error.message } : {}),
    };
  } catch (error) {
    db = {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "unknown error",
    };
  }

  return NextResponse.json(
    {
      status: db.ok ? "ok" : "degraded",
      service: "prism-manage",
      timestamp: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      checks: { db },
      integrations: {
        sentry: Boolean(
          process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
        ),
        slack: Boolean(process.env.SLACK_WEBHOOK_URL),
        cron: Boolean(process.env.CRON_SECRET),
        gemini: Boolean(
          process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY,
        ),
        github: Boolean(process.env.GITHUB_PAT),
        googleCalendar: Boolean(process.env.GOOGLE_CLIENT_ID),
      },
    },
    { status: db.ok ? 200 : 503 },
  );
}
