/**
 * PayPal Webhook Handler (Prism Admin)
 *
 * POST /api/webhooks/paypal
 *
 * CONSOLIDATED HANDLER (Phase 1 correctness debt):
 * - Writes prism_subscriptions — the table prism-engine actually enforces —
 *   NOT the legacy agency `subscriptions` table this file used to target.
 * - Signature verification is REQUIRED. If PAYPAL_WEBHOOK_ID (and client
 *   credentials) are unset the route fails closed with 503 instead of
 *   accepting unverified events.
 * - Idempotent via the shared `webhook_events` table (provider,event_id),
 *   same pattern as engine's canonical handler.
 *
 * NOTE: two PayPal webhook URLs historically existed (engine + admin).
 * Whichever one PayPal actually calls now writes correct data. Jeff still
 * needs to confirm the registered URL in the PayPal dashboard and retire
 * the loser so only ONE handler receives production events.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { sendEmail } from "@/lib/resend";

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

function verificationConfigured(): boolean {
  return Boolean(PAYPAL_WEBHOOK_ID && PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

async function verifyPayPalWebhook(
  request: NextRequest,
  body: string,
): Promise<boolean> {
  try {
    const transmissionId =
      request.headers.get("paypal-transmission-id") || "";
    const transmissionSig =
      request.headers.get("paypal-transmission-sig") || "";
    const certUrl = request.headers.get("paypal-cert-url") || "";
    const authAlgo = request.headers.get("paypal-auth-algo") || "";

    const verificationResponse = await fetch(
      "https://api-m.paypal.com/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
          ).toString("base64")}`,
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          webhook_id: PAYPAL_WEBHOOK_ID,
          webhook_event: JSON.parse(body),
        }),
      },
    );

    const result = (await verificationResponse.json()) as {
      verification_status?: string;
    };
    return result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("[paypal-webhook] Verification error:", error);
    return false;
  }
}

function getTierFromPlanId(planId?: string): "pro" | "team" | "enterprise" {
  if (!planId) return "pro";
  const teamPlans = [
    process.env.PAYPAL_PLAN_TEAM_MONTHLY,
    process.env.PAYPAL_PLAN_TEAM_ANNUAL,
  ].filter(Boolean);
  if (teamPlans.includes(planId)) return "team";
  return "pro";
}

type PayPalResource = {
  id: string;
  status: string;
  custom_id?: string;
  plan_id?: string;
  subscriber?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { amount?: { value?: string } };
  };
};

type PayPalEvent = {
  id?: string;
  event_type: string;
  resource: PayPalResource;
  event_version?: string;
  create_time?: string;
};

// =============================================================================
// Idempotency (shared `webhook_events` table — same pattern as engine)
// =============================================================================

async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const db = getPrismDb();
    const { data: existing } = await db
      .from("webhook_events")
      .select("id")
      .eq("provider", "paypal")
      .eq("event_id", eventId)
      .maybeSingle();
    return !!existing;
  } catch {
    return false;
  }
}

async function markEvent(
  eventId: string,
  eventType: string,
  status: "processing" | "completed" | "failed",
  payload?: unknown,
  error?: string,
): Promise<void> {
  try {
    const db = getPrismDb();
    if (status === "processing") {
      await db.from("webhook_events").upsert(
        {
          provider: "paypal",
          event_id: eventId,
          event_type: eventType,
          payload,
          status,
        },
        { onConflict: "provider,event_id" },
      );
      return;
    }
    await db
      .from("webhook_events")
      .update({
        status,
        ...(error ? { error } : {}),
        processed_at: new Date().toISOString(),
      })
      .eq("provider", "paypal")
      .eq("event_id", eventId);
  } catch (err) {
    console.error("[paypal-webhook] Failed to record event state:", err);
  }
}

export async function POST(request: NextRequest) {
  // Fail closed when verification cannot run — an unverified subscription
  // webhook is a forge-a-subscription hole.
  if (!verificationConfigured()) {
    console.error(
      "[paypal-webhook] PAYPAL_WEBHOOK_ID / PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not fully configured — refusing to process events",
    );
    return NextResponse.json(
      { error: "Webhook verification not configured" },
      { status: 503 },
    );
  }

  try {
    const rawBody = await request.text();
    const body: PayPalEvent = JSON.parse(rawBody);

    const isValid = await verifyPayPalWebhook(request, rawBody);
    if (!isValid) {
      console.error("[paypal-webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Idempotency — PayPal retries deliveries; process each event once.
    const eventId = body.id || request.headers.get("paypal-transmission-id");
    if (!eventId) {
      console.error("[paypal-webhook] Event has no id — cannot dedupe");
      return NextResponse.json({ received: true });
    }
    if (await isEventProcessed(eventId)) {
      console.log(`[paypal-webhook] Duplicate event ${eventId} — ignored`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    await markEvent(eventId, body.event_type, "processing", body);

    const { event_type, resource } = body;
    const userId = resource.custom_id;

    if (!userId) {
      console.log(
        "[paypal-webhook] No userId in payload — likely not a subscription event",
      );
      await markEvent(eventId, event_type, "completed");
      return NextResponse.json({ received: true });
    }

    console.log(`[paypal-webhook] Event: ${event_type} for user ${userId}`);

    switch (event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(userId, resource);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionStatus(userId, "cancelled");
        break;

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await handleSubscriptionStatus(userId, "past_due");
        break;

      case "PAYMENT.SALE.COMPLETED":
        await handlePaymentCompleted(userId);
        break;

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        await handlePaymentFailed(userId, resource);
        break;

      default:
        console.log(`[paypal-webhook] Unhandled event type: ${event_type}`);
    }

    await markEvent(eventId, event_type, "completed");
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[paypal-webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

/**
 * BILLING.SUBSCRIPTION.ACTIVATED — upsert prism_subscriptions (enforced
 * table) and sync user_profiles.tier secondarily for display consistency.
 */
async function handleSubscriptionActivated(
  userId: string,
  resource: PayPalResource,
) {
  const tier = getTierFromPlanId(resource.plan_id);
  const nextBilling = resource.billing_info?.next_billing_time;
  const now = new Date();
  const periodEnd = nextBilling
    ? new Date(nextBilling)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const db = getPrismDb();

  const { error: subError } = await db.from("prism_subscriptions").upsert(
    {
      user_id: userId,
      tier,
      status: "active",
      paypal_subscription_id: resource.id,
      modified_by: "paypal-webhook-admin",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id", ignoreDuplicates: false },
  );

  if (subError) {
    console.error("[paypal-webhook] Failed to upsert subscription:", subError);
    return;
  }

  // Display-only sync; enforcement reads prism_subscriptions.
  const { error: profileError } = await db
    .from("user_profiles")
    .update({ tier, updated_at: now.toISOString() })
    .eq("id", userId);

  if (profileError) {
    console.error("[paypal-webhook] Failed to update user tier:", profileError);
  }

  console.log(`[paypal-webhook] Activated ${tier} subscription for ${userId}`);
}

type PrismSubStatus = "active" | "cancelled" | "past_due";

/**
 * Status-only transitions (CANCELLED / SUSPENDED) on the enforced table.
 * A missing row means the user never had a prism subscription here — log
 * and move on rather than fabricating one.
 */
async function handleSubscriptionStatus(
  userId: string,
  status: PrismSubStatus,
): Promise<void> {
  const now = new Date().toISOString();

  const { data, error } = await getPrismDb()
    .from("prism_subscriptions")
    .update({
      status,
      updated_at: now,
      ...(status === "cancelled" ? { current_period_end: now } : {}),
    })
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error(
      `[paypal-webhook] Failed to set ${status} subscription:`,
      error,
    );
    return;
  }

  console.log(
    `[paypal-webhook] Subscription for ${userId} set to ${status}${data?.length ? "" : " (no existing row)"}`,
  );
}

/** PAYMENT.SALE.COMPLETED — extend the period on the enforced table. */
async function handlePaymentCompleted(userId: string) {
  const now = new Date();
  const nextPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { error } = await getPrismDb()
    .from("prism_subscriptions")
    .update({
      status: "active",
      current_period_end: nextPeriodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("[paypal-webhook] Failed to update payment:", error);
    return;
  }

  console.log(
    `[paypal-webhook] Payment completed for ${userId}, period extended`,
  );
}

/**
 * BILLING.SUBSCRIPTION.PAYMENT.FAILED — past_due on the enforced table +
 * notification email.
 */
async function handlePaymentFailed(
  userId: string,
  resource: PayPalResource,
) {
  const now = new Date().toISOString();
  const subscriberEmail = resource.subscriber?.email_address;

  const { error: subError } = await getPrismDb()
    .from("prism_subscriptions")
    .update({ status: "past_due", updated_at: now })
    .eq("user_id", userId);

  if (subError) {
    console.error(
      "[paypal-webhook] Failed to mark subscription as past_due:",
      subError,
    );
  }

  // Send notification email — use the subscriber email if available,
  // otherwise look up the user's email from the database
  let emailTo = subscriberEmail;
  if (!emailTo) {
    const { data: profile } = await getPrismDb()
      .from("user_profiles")
      .select("email")
      .eq("id", userId)
      .single();
    emailTo = profile?.email;
  }

  if (process.env.RESEND_API_KEY && emailTo) {
    await sendEmail({
      to: emailTo,
      subject: "Payment Failed — Prism Subscription",
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:40px 20px;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <div style="max-width:480px;margin:0 auto;">
              <div style="text-align:center;margin-bottom:32px;">
                <span style="font-size:18px;font-weight:600;color:#fff;">Prism Context Engine</span>
              </div>
              <div style="background:#0a0a0a;border:1px solid #ef444430;border-radius:12px;padding:32px;">
                <div style="width:48px;height:48px;border-radius:50%;background:#ef444420;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                  <span style="font-size:24px;">⚠️</span>
                </div>
                <h1 style="color:#fff;font-size:18px;margin:0 0 8px;text-align:center;">Payment Failed</h1>
                <p style="color:#ffffff99;font-size:14px;line-height:1.6;text-align:center;margin:0 0 24px;">
                  Your Prism subscription payment could not be processed. Please update your payment method to avoid service interruption.
                </p>
                <div style="background:#ffffff08;border-radius:8px;padding:16px;margin-bottom:24px;">
                  <p style="color:#ffffff60;font-size:12px;margin:0 0 4px;">Subscription ID</p>
                  <p style="color:#fff;font-size:13px;font-family:monospace;margin:0;">${resource.id}</p>
                </div>
                <a href="${process.env.NEXT_PUBLIC_PRISM_URL ?? "https://prism.syntaxure.dev"}/subscription" style="display:block;text-align:center;background:linear-gradient(135deg,#f59e0b,#fb923c);color:#000;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
                  Update Payment Method
                </a>
              </div>
              <p style="color:#ffffff30;font-size:11px;text-align:center;margin-top:24px;">
                © ${new Date().getFullYear()} Prism Context Engine
              </p>
            </div>
          </body>
        </html>
      `,
    });
  }

  console.log(
    `[paypal-webhook] Payment failed for ${userId}, notification sent`,
  );
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    webhook: "paypal",
    verificationConfigured: verificationConfigured(),
    timestamp: new Date().toISOString(),
  });
}
