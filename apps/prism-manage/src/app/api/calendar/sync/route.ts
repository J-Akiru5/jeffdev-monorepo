import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { pullGoogleEvents } from "@/lib/google-calendar";
import { logger } from "@/lib/log";
import { notifySlack } from "@/lib/slack";

/**
 * POST /api/calendar/sync
 * Manual sync for the current session's user.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pullGoogleEvents(user.id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json(result);
}

export const maxDuration = 60;

/**
 * GET /api/calendar/sync
 * Scheduled reconciliation for ALL connected users (Vercel Cron, daily).
 * - one retry per user for transient Google API failures
 * - structured logs for every run
 * - Slack alert when any user fails or the run crashes (best-effort)
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  logger.info("calendar.sync.start");

  try {
    const admin = getAdminClient();
    const { data: tokens, error: tokensError } = await admin
      .from("user_tokens")
      .select("user_id")
      .eq("provider", "google");
    if (tokensError) throw new Error(tokensError.message);

    const results: {
      userId: string;
      synced: number;
      removed: number;
      attempts: number;
      error?: string;
    }[] = [];

    for (const token of tokens || []) {
      const userId = String(token.user_id);
      let result = await pullGoogleEvents(userId);
      let attempts = 1;

      // One retry for transient failures (expired-token errors persist, but
      // a retry is cheap and covers Google API blips).
      if (result.error) {
        attempts = 2;
        await new Promise((resolve) => setTimeout(resolve, 500));
        result = await pullGoogleEvents(userId);
      }

      results.push({ userId, attempts, ...result });
    }

    const failed = results.filter((r) => r.error);
    const durationMs = Date.now() - startedAt;

    logger.info("calendar.sync.done", {
      users: results.length,
      failed: failed.length,
      durationMs,
    });

    if (failed.length > 0) {
      logger.warn("calendar.sync.failures", {
        userIds: failed.map((f) => f.userId),
        firstError: failed[0]?.error,
      });
      await notifySlack(
        `:warning: prism-manage calendar sync: ${failed.length}/${results.length} user(s) failed after retry — ${failed[0]?.error ?? "unknown error"}`,
      );
    }

    return NextResponse.json({
      users: results.length,
      failed: failed.length,
      durationMs,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    logger.error("calendar.sync.fatal", {
      error: message,
      durationMs: Date.now() - startedAt,
    });
    await notifySlack(`:rotating_light: prism-manage calendar sync crashed: ${message}`);
    return NextResponse.json({ error: "Calendar sync failed" }, { status: 500 });
  }
}
