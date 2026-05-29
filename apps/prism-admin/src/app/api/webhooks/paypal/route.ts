/**
 * PayPal Webhook Handler (Prism Admin)
 *
 * POST /api/webhooks/paypal
 * Receives PayPal subscription events and writes to Supabase.
 *
 * Uses PayPal REST API webhook signature verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

/**
 * Verify PayPal webhook signature using REST API verification
 */
async function verifyPayPalWebhook(
  request: NextRequest,
  body: string,
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn(
      "[paypal-webhook] PAYPAL_WEBHOOK_ID not set — skipping verification",
    );
    return true;
  }

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
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
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

/**
 * Map a PayPal plan ID to a subscription tier
 */
function getTierFromPlanId(planId?: string): "pro" | "team" | "enterprise" {
  if (!planId) return "pro";
  const teamPlans = [
    process.env.PAYPAL_PLAN_TEAM_MONTHLY,
    process.env.PAYPAL_PLAN_TEAM_ANNUAL,
  ].filter(Boolean);
  if (teamPlans.includes(planId)) return "team";
  return "pro";
}

/**
 * Map subscription status from billing info
 */
function getBillingCycle(planId?: string): "monthly" | "annual" {
  if (!planId) return "monthly";
  if (planId.endsWith("_annual") || planId.includes("annual")) return "annual";
  return "monthly";
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
  event_type: string;
  resource: PayPalResource;
  event_version?: string;
  create_time?: string;
};

// Helper to get a typed Supabase client
function getDb() {
  return getAdminClient();
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body: PayPalEvent = JSON.parse(rawBody);

    // Verify the webhook signature
    const isValid = await verifyPayPalWebhook(request, rawBody);
    if (!isValid) {
      console.error("[paypal-webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { event_type, resource } = body;
    const userId = resource.custom_id;

    if (!userId) {
      console.log(
        "[paypal-webhook] No userId in payload — likely not a subscription event",
      );
      return NextResponse.json({ received: true });
    }

    console.log(
      `[paypal-webhook] Event: ${event_type} for user ${userId}`,
    );

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
        await handlePaymentFailed(userId, resource);
        break;

      default:
        console.log(
          `[paypal-webhook] Unhandled event type: ${event_type}`,
        );
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

/**
 * Handle BILLING.SUBSCRIPTION.ACTIVATED
 * - Create/update subscription record in Supabase
 * - Update user_profiles.tier
 */
async function handleSubscriptionActivated(
  userId: string,
  resource: PayPalResource,
) {
  const tier = getTierFromPlanId(resource.plan_id);
  const billingCycle = getBillingCycle(resource.plan_id);
  const subscriberEmail = resource.subscriber?.email_address;
  const nextBilling = resource.billing_info?.next_billing_time;
  const lastPayment = resource.billing_info?.last_payment?.amount?.value;
  const now = new Date();
  const periodEnd = nextBilling
    ? new Date(nextBilling)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Upsert the subscription in Supabase
  const { error: subError } = await getDb().from("subscriptions").upsert({
    user_id: userId,
    plan: tier,
    status: "active",
    billing_cycle: billingCycle,
    amount: lastPayment ? parseFloat(lastPayment).toString() : "0",
    currency: "USD",
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    paypal_subscription_id: resource.id,
    user_email: subscriberEmail || null,
    updated_at: now.toISOString(),
  }, {
    onConflict: "user_id",
    ignoreDuplicates: false,
  });

  if (subError) {
    console.error(
      "[paypal-webhook] Failed to upsert subscription:",
      subError,
    );
    return;
  }

  // Update the user's tier in user_profiles
  const { error: profileError } = await getDb().from("user_profiles")
    .update({ tier, updated_at: now.toISOString() })
    .eq("id", userId);

  if (profileError) {
    console.error(
      "[paypal-webhook] Failed to update user tier:",
      profileError,
    );
  }

  console.log(
    `[paypal-webhook] Activated ${tier} subscription for ${userId}`,
  );
}

/**
 * Handle BILLING.SUBSCRIPTION.CANCELLED
 * - Mark subscription as cancelled
 */
async function handleSubscriptionCancelled(userId: string) {
  const now = new Date();

  const { error: subError } = await getDb().from("subscriptions")
    .update({
      status: "cancelled",
      cancel_at_period_end: true,
      cancelled_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);

  if (subError) {
    console.error(
      "[paypal-webhook] Failed to cancel subscription:",
      subError,
    );
    return;
  }

  console.log(`[paypal-webhook] Cancelled subscription for ${userId}`);
}

/**
 * Handle BILLING.SUBSCRIPTION.SUSPENDED
 * - Mark subscription as past_due
 */
async function handleSubscriptionSuspended(userId: string) {
  const now = new Date();

  const { error: subError } = await getDb().from("subscriptions")
    .update({ status: "past_due", updated_at: now.toISOString() })
    .eq("user_id", userId);

  if (subError) {
    console.error(
      "[paypal-webhook] Failed to suspend subscription:",
      subError,
    );
    return;
  }

  console.log(`[paypal-webhook] Suspended subscription for ${userId}`);
}

/**
 * Handle PAYMENT.SALE.COMPLETED
 * - Update subscription period end
 */
async function handlePaymentCompleted(userId: string) {
  const now = new Date();
  const nextPeriodEnd = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000,
  );

  const { error: subError } = await getDb().from("subscriptions")
    .update({
      status: "active",
      current_period_end: nextPeriodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);

  if (subError) {
    console.error(
      "[paypal-webhook] Failed to update payment:",
      subError,
    );
    return;
  }

  console.log(
    `[paypal-webhook] Payment completed for ${userId}, period extended`,
  );
}

/**
 * Handle BILLING.SUBSCRIPTION.PAYMENT.FAILED
 * - Mark subscription as past_due
 * - Send notification email
 */
async function handlePaymentFailed(
  userId: string,
  resource: PayPalResource,
) {
  const now = new Date();
  const subscriberEmail = resource.subscriber?.email_address;

  const { error: subError } = await getDb().from("subscriptions")
    .update({ status: "past_due", updated_at: now.toISOString() })
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
    const { data: profile } = await getDb().from("user_profiles")
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
    timestamp: new Date().toISOString(),
  });
}
