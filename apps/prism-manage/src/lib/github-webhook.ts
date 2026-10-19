/**
 * GitHub webhook helpers (arc 3 · D3)
 * -----------------------------------
 * Pure, testable pieces of the reverse-sync: HMAC signature verification
 * (x-hub-signature-256) and the issues-event → task-status mapping.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** Maps a GitHub `issues` event action to a task status (null = ignore). */
export function mapIssueActionToStatus(
  action: string,
): "approved" | "backlog" | null {
  if (action === "closed") return "approved";
  if (action === "reopened") return "backlog";
  return null;
}

/** Constant-time verification of the webhook HMAC signature. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !signature.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const provided = signature.slice("sha256=".length);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
