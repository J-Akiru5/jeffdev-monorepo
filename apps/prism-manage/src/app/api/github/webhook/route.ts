import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/log";
import {
  mapIssueActionToStatus,
  verifyWebhookSignature,
} from "@/lib/github-webhook";

/**
 * POST /api/github/webhook  (arc 3 · D3)
 * --------------------------------------
 * Reverse sync: GitHub issue events update the linked task's status.
 * Auth: HMAC signature (x-hub-signature-256) against GITHUB_WEBHOOK_SECRET —
 * fail-closed when the secret is unset.
 *
 * Note: this path intentionally bypasses the approval RBAC — closing the
 * issue on GitHub is the authoritative action, and the task↔issue link was
 * created by a workspace member.
 */

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event") || "";
  if (event === "ping") {
    return NextResponse.json({ ok: true, pong: true });
  }
  if (event !== "issues") {
    return NextResponse.json({ ok: true, ignored: event });
  }

  try {
    const payload = JSON.parse(rawBody) as {
      action?: string;
      issue?: { number?: number };
    };
    const issueNumber = payload.issue?.number;
    const status = mapIssueActionToStatus(String(payload.action || ""));

    if (!issueNumber || !status) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const admin = getAdminClient();
    const { data: task } = await admin
      .from("tasks")
      .select("id, status")
      .eq("github_issue_number", issueNumber)
      .maybeSingle();

    if (!task) {
      logger.info("github.webhook.no_task", { issueNumber });
      return NextResponse.json({ ok: true, matched: false });
    }
    if (task.status === status) {
      return NextResponse.json({ ok: true, unchanged: true });
    }

    const { error } = await admin
      .from("tasks")
      .update({ status } as never)
      .eq("id", task.id);
    if (error) throw new Error(error.message);

    logger.info("github.webhook.status_synced", {
      issueNumber,
      taskId: task.id,
      status,
    });
    return NextResponse.json({ ok: true, taskId: task.id, status });
  } catch (error) {
    logger.error("github.webhook.failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
