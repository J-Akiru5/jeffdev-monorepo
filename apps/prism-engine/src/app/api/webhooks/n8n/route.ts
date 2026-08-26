import { logError } from "@/lib/log-error";
/**
 * n8n Webhook Receiver
 *
 * POST /api/webhooks/n8n
 *
 * Internal endpoint that receives events forwarded from other services
 * (PayPal, in-app actions) and relays them to n8n for automation.
 * This acts as a routing layer so n8n doesn't need direct access to every service.
 *
 * n8n can also poll this endpoint to check for pending events.
 *
 * Events handled:
 * - subscription.* — PayPal subscription lifecycle events
 * - notification.* — In-app notification events
 */

import { NextResponse } from "next/server";
import { z } from "zod";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
// Use PRISM_API_KEY for auth (already registered in turbo.json globalEnv)
const INTERNAL_API_KEY = process.env.PRISM_API_KEY;

const EventSchema = z.object({
  event: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  source: z.string().optional(),
  timestamp: z.string().optional(),
});

type RelayEvent = z.infer<typeof EventSchema>;

/**
 * POST /api/webhooks/n8n
 *
 * Receives events from internal services and relays them to n8n.
 * Requires INTERNAL_API_KEY in the X-Api-Key header.
 */
export async function POST(request: Request) {
  try {
    // Verify internal API key
    const apiKey = request.headers.get("X-Api-Key");
    if (!INTERNAL_API_KEY) {
      logError("app/api/webhooks/n8n/route", "[n8n-relay] PRISM_API_KEY not configured — rejecting request");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    if (apiKey !== INTERNAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = EventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid event format",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const event = parsed.data;

    // Log event for audit trail
    console.log(`[n8n-relay] Relaying event: ${event.event}`, {
      source: event.source || "unknown",
      timestamp: event.timestamp || new Date().toISOString(),
    });

    // If n8n is not configured, just acknowledge (non-blocking)
    if (!N8N_WEBHOOK_URL) {
      console.log("[n8n-relay] N8N_WEBHOOK_URL not configured — event logged only");
      return NextResponse.json({
        received: true,
        relayed: false,
        reason: "n8n not configured",
      });
    }

    // Relay to n8n
    const relayBody: RelayEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      source: event.source || "prism-engine",
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Event-Source": "prism-engine",
      },
      body: JSON.stringify(relayBody),
    });

    if (!response.ok) {
      logError("app/api/webhooks/n8n/route", 
        `[n8n-relay] n8n returned ${response.status}: ${response.statusText}`,
      );
      return NextResponse.json(
        { received: true, relayed: false, error: "n8n relay failed" },
        { status: 502 },
      );
    }

    console.log(`[n8n-relay] ✅ Event ${event.event} relayed to n8n successfully`);
    return NextResponse.json({ received: true, relayed: true });
  } catch (error) {
    logError("app/api/webhooks/n8n/route", "[n8n-relay] Error processing event:", error);
    return NextResponse.json(
      { error: "Failed to process event" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/webhooks/n8n
 *
 * Health check endpoint for n8n to verify this relay is available.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "n8n-relay",
    n8nConfigured: !!N8N_WEBHOOK_URL,
    timestamp: new Date().toISOString(),
  });
}
