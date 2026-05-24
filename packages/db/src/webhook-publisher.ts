/**
 * @module @syntaxure-labs/db/webhook-publisher
 * @description Webhook event publisher for n8n automation integration.
 *
 * Provides a lightweight helper to fire events from any app to n8n's webhook receiver.
 * Use this in server actions, API routes, or anywhere an event should trigger
 * an automated workflow (Discord notifications, emails, social media posts, etc.).
 *
 * @example
 * import { publishEvent } from "@syntaxure-labs/db/webhook-publisher";
 *
 * // After a release
 * await publishEvent("release.created", {
 *   version: "1.2.0",
 *   changelog: "- Fixed bugs\n- Added features",
 * });
 *
 * // After a new waitlist signup
 * await publishEvent("waitlist.signed_up", {
 *   email: "user@example.com",
 *   source: "website",
 * });
 */

const N8N_WEBHOOK_BASE = process.env.N8N_WEBHOOK_URL || "";
const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * Event name for n8n automation.
 * Use dot-notation namespacing: `<domain>.<action>`
 * e.g. "release.created", "waitlist.signed_up", "subscription.activated"
 */
export type N8nEvent = string;

export interface N8nEventPayload {
  event: N8nEvent;
  payload: Record<string, unknown>;
  timestamp: string;
  source: string;
}

/**
 * Publish an event to the n8n webhook endpoint.
 * All apps in the monorepo can call this to trigger automated workflows.
 *
 * The function silently fails if n8n is not configured (no N8N_WEBHOOK_URL),
 * so it's safe to call anywhere without breaking existing logic.
 *
 * @param event - The event type name (e.g. "release.created")
 * @param payload - Arbitrary event data to send
 * @param source - Optional source identifier (e.g. "prism-engine", "syntaxure-labs")
 *   Defaults to "unknown" — pass explicitly for better observability.
 */
export async function publishEvent(
  event: N8nEvent,
  payload: Record<string, unknown>,
  source?: string,
): Promise<{ success: boolean }> {
  if (!N8N_WEBHOOK_BASE) {
    // n8n not configured — silently no-op
    return { success: false };
  }

  const body: N8nEventPayload = {
    event,
    payload,
    timestamp: new Date().toISOString(),
    source: source || "unknown",
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const response = await fetch(N8N_WEBHOOK_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.warn(
        `[n8n-webhook] Event "${event}" returned ${response.status}: ${response.statusText}`,
      );
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    // Fail silently in production — n8n is non-critical infrastructure
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(`[n8n-webhook] Event "${event}" timed out after ${DEFAULT_TIMEOUT_MS}ms`);
    } else {
      console.warn(`[n8n-webhook] Event "${event}" failed:`, error);
    }
    return { success: false };
  }
}

/**
 * Convenience wrappers for common events.
 * These keep calling code clean and self-documenting.
 */

export function publishReleaseCreated(version: string, changelog: string) {
  return publishEvent("release.created", { version, changelog });
}

export function publishWaitlistSignup(email: string, source: string) {
  return publishEvent("waitlist.signed_up", { email, source });
}

export function publishSubscriptionEvent(
  event: "activated" | "cancelled" | "payment_failed" | "payment_completed",
  userId: string,
  metadata?: Record<string, unknown>,
) {
  return publishEvent(
    `subscription.${event}`,
    { userId, ...metadata },
  );
}

export function publishContactSubmission(
  name: string,
  email: string,
  subject: string,
) {
  return publishEvent("contact.form_submitted", { name, email, subject });
}

export function publishQuoteRequest(
  name: string,
  email: string,
  projectType: string,
  budget: string,
) {
  return publishEvent("quote.requested", { name, email, projectType, budget });
}

export function publishDeploymentEvent(
  event: "started" | "completed" | "failed",
  appName: string,
  commitSha?: string,
  errorMessage?: string,
) {
  return publishEvent(
    `deployment.${event}`,
    { appName, commitSha, errorMessage },
  );
}
