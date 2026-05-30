/**
 * PayPal Webhook Handler
 *
 * POST /api/webhooks/paypal
 * Handles PayPal subscription events with signature verification
 */

import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@syntaxure-labs/db";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_API_URL =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function verifyPayPalWebhook(
  request: NextRequest,
  body: string,
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.error(
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
    console.error("[paypal-webhook] Verification error:", error);
    return false;
  }
}

type PayPalEvent = {
  event_type: string;
  resource: {
    id: string;
    status: string;
    custom_id?: string;
    plan_id?: string;
    billing_info?: {
      next_billing_time: string;
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body: PayPalEvent = JSON.parse(rawBody);

    const isValid = await verifyPayPalWebhook(request, rawBody);
    if (!isValid) {
      console.error("[paypal-webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { event_type, resource } = body;
    const userId = resource.custom_id;

    if (!userId) {
      console.error("[paypal-webhook] No userId in payload");
      return NextResponse.json({ received: true });
    }

    console.log(`[paypal-webhook] Event: ${event_type} for user ${userId}`);

    switch (event_type) {
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
        await handlePaymentCompleted(userId);
        break;
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        await handlePaymentFailed(userId);
        break;
      default:
        console.log(`[paypal-webhook] Unhandled: ${event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[paypal-webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function handleSubscriptionActivated(
  userId: string,
  resource: PayPalEvent["resource"],
) {
  const tier = getTierFromPlanId(resource.plan_id);
  const nextBilling = resource.billing_info?.next_billing_time;
  const now = new Date();

  const subscriptions = await getCollection("subscriptions");
  await subscriptions.updateOne(
    { userId },
    {
      $set: {
        tier,
        status: "active",
        paypalSubscriptionId: resource.id,
        currentPeriodEnd: nextBilling
          ? new Date(nextBilling)
          : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      $setOnInsert: {
        userId,
        currentPeriodStart: now,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log(`[paypal-webhook] Activated ${tier} for ${userId}`);
}

async function handleSubscriptionCancelled(userId: string) {
  const subscriptions = await getCollection("subscriptions");
  await subscriptions.updateOne(
    { userId },
    { $set: { status: "cancelled", updatedAt: new Date() } },
  );
  console.log(`[paypal-webhook] Cancelled subscription for ${userId}`);
}

async function handleSubscriptionSuspended(userId: string) {
  const subscriptions = await getCollection("subscriptions");
  await subscriptions.updateOne(
    { userId },
    { $set: { status: "past_due", updatedAt: new Date() } },
  );
  console.log(`[paypal-webhook] Suspended subscription for ${userId}`);
}

async function handlePaymentCompleted(userId: string) {
  const usage = await getCollection("usage");
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  await usage.updateOne(
    { userId, month },
    {
      $set: {
        aiGenerations: 0,
        rulesCreated: 0,
        componentsCreated: 0,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  console.log(`[paypal-webhook] Reset usage counters for ${userId}`);
}

async function handlePaymentFailed(userId: string) {
  const subscriptions = await getCollection("subscriptions");
  await subscriptions.updateOne(
    { userId },
    { $set: { status: "past_due", updatedAt: new Date() } },
  );

  if (process.env.RESEND_API_KEY) {
    try {
      // Look up user email from Supabase Auth
      let recipientEmail = userId;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: user } = await supabase.auth.admin.getUserById(userId);
        if (user?.user?.email) {
          recipientEmail = user.user.email;
        }
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Prism <billing@prism.syntaxure.dev>",
        to: recipientEmail,
        subject: "Payment Failed — Prism Subscription",
        html: `<p>Your Prism subscription payment failed. Please update your payment method.</p>`,
      });
    } catch (error) {
      console.error("[paypal-webhook] Email notification failed:", error);
    }
  }

  console.log(`[paypal-webhook] Payment failed for ${userId}`);
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
