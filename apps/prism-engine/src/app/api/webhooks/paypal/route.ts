import { logError } from "@/lib/log-error";
/**
 * PayPal Webhook Handler
 *
 * POST /api/webhooks/paypal
 * Handles PayPal subscription events with:
 * - Cryptographic signature verification
 * - Idempotency (dedup via the existing Postgres `webhook_events` table)
 * - Payment receipt emails
 * - Audit trail logging
 */

import { NextRequest, NextResponse } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_API_URL =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// =============================================================================
// Webhook Signature Verification
// =============================================================================

async function verifyPayPalWebhook(
  request: NextRequest,
  body: string,
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    logError("app/api/webhooks/paypal/route", 
      "[paypal-webhook] PAYPAL_WEBHOOK_ID not set — rejecting webhook",
    );
    return false;
  }
  try {
    const transmissionId = request.headers.get("paypal-transmission-id") || "";
    const transmissionSig =
      request.headers.get("paypal-transmission-sig") || "";
    const certUrl = request.headers.get("paypal-cert-url") || "";
    const authAlgo = request.headers.get("paypal-auth-algo") || "";

    const verificationResponse = await fetch(
      `${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
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
    logError("app/api/webhooks/paypal/route", "[paypal-webhook] Verification error:", error);
    return false;
  }
}

// =============================================================================
// Idempotency Check (Postgres `webhook_events` — shared with the agency app,
// already existed pre-migration; Prism just points at it now too)
// =============================================================================

async function isEventProcessed(
  provider: string,
  eventId: string,
): Promise<boolean> {
  try {
    const db = getPrismDb();
    const { data: existing } = await db
      .from("webhook_events")
      .select("id")
      .eq("provider", provider)
      .eq("event_id", eventId)
      .maybeSingle();
    return !!existing;
  } catch {
    return false;
  }
}

async function markEventProcessing(
  provider: string,
  eventId: string,
  eventType: string,
  payload: unknown,
): Promise<void> {
  try {
    const db = getPrismDb();
    await db.from("webhook_events").upsert(
      {
        provider,
        event_id: eventId,
        event_type: eventType,
        payload,
        status: "processing",
      },
      { onConflict: "provider,event_id" },
    );
  } catch (error) {
    logError("app/api/webhooks/paypal/route", "[webhook] Failed to mark event processing:", error);
  }
}

async function markEventCompleted(
  provider: string,
  eventId: string,
): Promise<void> {
  try {
    const db = getPrismDb();
    await db
      .from("webhook_events")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("provider", provider)
      .eq("event_id", eventId);
  } catch (error) {
    logError("app/api/webhooks/paypal/route", "[webhook] Failed to mark event completed:", error);
  }
}

async function markEventFailed(
  provider: string,
  eventId: string,
  error: string,
): Promise<void> {
  try {
    const db = getPrismDb();
    await db
      .from("webhook_events")
      .update({
        status: "failed",
        error,
        processed_at: new Date().toISOString(),
      })
      .eq("provider", provider)
      .eq("event_id", eventId);
  } catch (err) {
    logError("app/api/webhooks/paypal/route", "[webhook] Failed to mark event failed:", err);
  }
}

// =============================================================================
// Types
// =============================================================================

type PayPalEvent = {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status: string;
    custom_id?: string;
    plan_id?: string;
    billing_info?: {
      next_billing_time: string;
    };
    amount?: {
      total: string;
      currency: string;
    };
  };
};

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body: PayPalEvent = JSON.parse(rawBody);
    const eventId = body.id;
    const eventType = body.event_type;

    // 1. Verify signature
    const isValid = await verifyPayPalWebhook(request, rawBody);
    if (!isValid) {
      logError("app/api/webhooks/paypal/route", "[paypal-webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Check idempotency
    if (await isEventProcessed("paypal", eventId)) {
      console.log(`[paypal-webhook] Duplicate event ${eventId}, skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 3. Mark as processing
    await markEventProcessing("paypal", eventId, eventType, body);

    const { resource } = body;
    const userId = resource.custom_id;

    if (!userId) {
      logError("app/api/webhooks/paypal/route", "[paypal-webhook] No userId in payload");
      await markEventCompleted("paypal", eventId);
      return NextResponse.json({ received: true });
    }

    // 4. Process event
    try {
      switch (eventType) {
        case "BILLING.SUBSCRIPTION.ACTIVATED":
          await handleSubscriptionActivated(userId, resource);
          break;
        case "BILLING.SUBSCRIPTION.CANCELLED":
          await handleSubscriptionCancelled(userId);
          break;
        case "BILLING.SUBSCRIPTION.SUSPENDED":
          await handleSubscriptionSuspended(userId);
          break;
        case "PAYMENT.SALE.COMPLETED":
          await handlePaymentCompleted(userId, resource);
          break;
        case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
          await handlePaymentFailed(userId);
          break;
      }

      // 5. Mark as completed
      await markEventCompleted("paypal", eventId);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      await markEventFailed("paypal", eventId, errMsg);
      throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logError("app/api/webhooks/paypal/route", "[paypal-webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

// =============================================================================
// Email Helpers
// =============================================================================

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    // Try Supabase auth lookup
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );
    const { data } = await supabase.auth.admin.getUserById(userId);
    return data?.user?.email || null;
  } catch {
    return null;
  }
}

async function sendReceiptEmail(
  email: string,
  amount: string,
  currency: string,
  tier: string,
) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Prism <billing@prism.syntaxure.dev>",
      to: email,
      subject: `Payment Confirmed — Prism ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Payment Confirmed!</h2>
          <p>Thank you for your subscription. Your payment has been processed successfully.</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
            <p style="margin: 4px 0;"><strong>Amount:</strong> ${currency} ${amount}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p>You can manage your subscription anytime from your dashboard.</p>
          <a href="${process.env.NEXT_PUBLIC_PRISM_URL || "https://prism.syntaxure.dev"}/dashboard"
             style="display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Go to Dashboard
          </a>
        </div>
      `,
    });
  } catch (error) {
    logError("app/api/webhooks/paypal/route", "[paypal-webhook] Receipt email failed:", error);
  }
}

async function sendPaymentFailureEmail(email: string) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Prism <billing@prism.syntaxure.dev>",
      to: email,
      subject: "Payment Failed — Action Required",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Payment Failed</h2>
          <p>We were unable to process your subscription payment.</p>
          <p>Please update your payment method to avoid service interruption.</p>
          <a href="${process.env.NEXT_PUBLIC_PRISM_URL || "https://prism.syntaxure.dev"}/subscription"
             style="display: inline-block; background: #f59e0b; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Update Payment Method
          </a>
        </div>
      `,
    });
  } catch (error) {
    logError("app/api/webhooks/paypal/route", "[paypal-webhook] Failure email failed:", error);
  }
}

// =============================================================================
// Event Handlers
// =============================================================================

async function handleSubscriptionActivated(
  userId: string,
  resource: PayPalEvent["resource"],
) {
  const tier = getTierFromPlanId(resource.plan_id);
  const nextBilling = resource.billing_info?.next_billing_time;
  const now = new Date();
  const currentPeriodEnd = nextBilling
    ? new Date(nextBilling)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const db = getPrismDb();
  const { data: existing } = await db
    .from("prism_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  await db.from("prism_subscriptions").upsert(
    {
      user_id: userId,
      tier,
      status: "active",
      paypal_subscription_id: resource.id,
      current_period_end: currentPeriodEnd.toISOString(),
      updated_at: now.toISOString(),
      ...(existing ? {} : { current_period_start: now.toISOString() }),
    },
    { onConflict: "user_id" },
  );

  // Send receipt email
  const email = await getUserEmail(userId);
  if (email) {
    await sendReceiptEmail(
      email,
      resource.amount?.total || "0",
      resource.amount?.currency || "USD",
      tier,
    );
  }
}

async function handleSubscriptionCancelled(userId: string) {
  const db = getPrismDb();
  await db
    .from("prism_subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

async function handleSubscriptionSuspended(userId: string) {
  const db = getPrismDb();
  await db
    .from("prism_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

async function handlePaymentCompleted(
  userId: string,
  _resource: PayPalEvent["resource"],
) {
  const db = getPrismDb();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  await db.from("prism_usage").upsert(
    {
      user_id: userId,
      month,
      ai_generations: 0,
      rules_created: 0,
      components_created: 0,
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id,month" },
  );
}

async function handlePaymentFailed(userId: string) {
  const db = getPrismDb();
  await db
    .from("prism_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  // Send failure email to actual email address
  const email = await getUserEmail(userId);
  if (email) {
    await sendPaymentFailureEmail(email);
  }
}

function getTierFromPlanId(planId?: string): "pro" | "team" | "enterprise" {
  if (!planId) return "pro";
  if (
    planId === process.env.PAYPAL_PLAN_TEAM_MONTHLY ||
    planId === process.env.PAYPAL_PLAN_TEAM_ANNUAL
  ) {
    return "team";
  }
  return "pro";
}
