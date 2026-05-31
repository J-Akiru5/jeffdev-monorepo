/**
 * Maya Webhook Handler
 *
 * POST /api/webhooks/maya
 * Handles Maya payment events with:
 * - Cryptographic signature verification
 * - Idempotency (dedup via webhook_events table)
 * - Payment receipt emails
 * - Audit trail logging
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import {
  verifyMayaWebhook,
  parseMayaWebhook,
  type MayaWebhookPayload,
} from "@/lib/maya";

// =============================================================================
// Idempotency Helpers
// =============================================================================

async function isEventProcessed(
  provider: string,
  eventId: string,
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    const { data } = await supabase
      .from("webhook_events")
      .select("id")
      .eq("provider", provider)
      .eq("event_id", eventId)
      .single();
    return !!data;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    await supabase.from("webhook_events").upsert(
      {
        provider,
        event_id: eventId,
        event_type: eventType,
        payload,
        status: "processing",
        created_at: new Date().toISOString(),
      },
      { onConflict: "provider,event_id" },
    );
  } catch (error) {
    console.error("[webhook] Failed to mark event processing:", error);
  }
}

async function markEventCompleted(
  provider: string,
  eventId: string,
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    await supabase
      .from("webhook_events")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("provider", provider)
      .eq("event_id", eventId);
  } catch (error) {
    console.error("[webhook] Failed to mark event completed:", error);
  }
}

async function markEventFailed(
  provider: string,
  eventId: string,
  errorMsg: string,
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    await supabase
      .from("webhook_events")
      .update({
        status: "failed",
        error: errorMsg,
        processed_at: new Date().toISOString(),
      })
      .eq("provider", provider)
      .eq("event_id", eventId);
  } catch (error) {
    console.error("[webhook] Failed to mark event failed:", error);
  }
}

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("maya-signature") || "";

    // 1. Verify webhook signature
    if (!verifyMayaWebhook(body, signature)) {
      console.error("[MAYA WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = parseMayaWebhook(body);
    const eventType = payload.eventType;
    const resource = payload.resource;
    const eventId = resource.id;

    console.log(`[MAYA WEBHOOK] Event: ${eventType}, ID: ${eventId}`);

    // 2. Check idempotency
    if (await isEventProcessed("maya", eventId)) {
      console.log(`[MAYA WEBHOOK] Duplicate event ${eventId}, skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 3. Mark as processing
    await markEventProcessing("maya", eventId, eventType, payload);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    // 4. Process event
    try {
      switch (eventType) {
        case "CHECKOUT.SUCCESSFUL":
        case "CHECKOUT.FAILED": {
          await handleCheckoutEvent(supabase, resource, eventType);
          break;
        }

        case "SUBSCRIPTION.ACTIVATED":
        case "SUBSCRIPTION.CANCELLED":
        case "SUBSCRIPTION.PAYMENT.FAILED": {
          await handleSubscriptionEvent(supabase, resource, eventType);
          break;
        }

        default:
          console.log(`[MAYA WEBHOOK] Unhandled event type: ${eventType}`);
      }

      // 5. Mark as completed
      await markEventCompleted("maya", eventId);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      await markEventFailed("maya", eventId, errMsg);
      throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[MAYA WEBHOOK] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// =============================================================================
// Event Handlers
// =============================================================================

async function handleCheckoutEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  resource: MayaWebhookPayload["resource"],
  eventType: string
) {
  const refNo = resource.referenceNo;

  if (eventType === "CHECKOUT.SUCCESSFUL") {
    // Update client contract status to active
    const { error: updateError } = await supabase
      .from("client_contracts")
      .update({
        status: "active",
        start_date: new Date().toISOString(),
        maya_checkout_id: resource.id,
        updated_at: new Date().toISOString(),
      })
      .eq("metadata->>referenceNo", refNo);

    if (updateError) {
      console.error("[MAYA WEBHOOK] Failed to update contract:", updateError);
    }

    // Update related quote status
    await supabase
      .from("quotes")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("metadata->>refNo", refNo);

    // Send confirmation email
    await sendPaymentConfirmationEmail(refNo, "checkout");
  } else if (eventType === "CHECKOUT.FAILED") {
    // Update contract status
    await supabase
      .from("client_contracts")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("metadata->>referenceNo", refNo);

    // Send failure notification
    await sendPaymentFailureEmail(refNo);
  }
}

async function handleSubscriptionEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  resource: MayaWebhookPayload["resource"],
  eventType: string
) {
  const subscriptionId = resource.id;

  if (eventType === "SUBSCRIPTION.ACTIVATED") {
    // Update client contract
    const { error } = await supabase
      .from("client_contracts")
      .update({
        status: "active",
        maya_subscription_id: subscriptionId,
        start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("maya_subscription_id", subscriptionId);

    if (error) {
      console.error("[MAYA WEBHOOK] Failed to update contract:", error);
    }

    // Send activation email
    await sendPaymentConfirmationEmail(subscriptionId, "subscription");
  } else if (eventType === "SUBSCRIPTION.CANCELLED") {
    await supabase
      .from("client_contracts")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("maya_subscription_id", subscriptionId);

    await sendCancellationEmail(subscriptionId);
  } else if (eventType === "SUBSCRIPTION.PAYMENT.FAILED") {
    await sendPaymentFailureEmail(subscriptionId);
  }
}

// =============================================================================
// Email Helpers
// =============================================================================

async function sendPaymentConfirmationEmail(
  referenceId: string,
  type: "checkout" | "subscription"
) {
  // Fetch contract details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getAdminClient() as any;
  const { data: contract } = await supabase
    .from("client_contracts")
    .select("*, product_templates(name), contract_terms(term_months, billing_cycle)")
    .or(`maya_checkout_id.eq.${referenceId},maya_subscription_id.eq.${referenceId}`)
    .single();

  if (!contract) return;

  const templateName = contract.product_templates?.name || "Product";
  const term = contract.contract_terms;
  const termLabel = term ? `${Math.floor(term.term_months / 12)}-year ${term.billing_cycle}` : "";

  await sendEmail({
    to: contract.client_email,
    subject: `Payment Confirmed - ${templateName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Payment Confirmed!</h2>
        <p>Thank you for your purchase. Your subscription is now active.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Product:</strong> ${templateName}</p>
          <p><strong>Plan:</strong> ${termLabel}</p>
          <p><strong>Amount:</strong> ₱${contract.amount.toLocaleString()}/${contract.billing_cycle === "monthly" ? "mo" : "yr"}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>We'll send you onboarding instructions shortly.</p>
      </div>
    `,
  });
}

async function sendPaymentFailureEmail(referenceId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getAdminClient() as any;
  const { data: contract } = await supabase
    .from("client_contracts")
    .select("client_email, client_name")
    .or(`maya_checkout_id.eq.${referenceId},maya_subscription_id.eq.${referenceId}`)
    .single();

  if (!contract) return;

  await sendEmail({
    to: contract.client_email,
    subject: "Payment Failed - Action Required",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Payment Failed</h2>
        <p>Hi ${contract.client_name},</p>
        <p>We were unable to process your payment. Please update your payment method to continue.</p>
        <a href="${process.env.NEXT_PUBLIC_SYNTAXURE_URL}/products" 
           style="display: inline-block; background: #f59e0b; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Update Payment Method
        </a>
      </div>
    `,
  });
}

async function sendCancellationEmail(subscriptionId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getAdminClient() as any;
  const { data: contract } = await supabase
    .from("client_contracts")
    .select("client_email, client_name")
    .eq("maya_subscription_id", subscriptionId)
    .single();

  if (!contract) return;

  await sendEmail({
    to: contract.client_email,
    subject: "Subscription Cancelled",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Subscription Cancelled</h2>
        <p>Hi ${contract.client_name},</p>
        <p>Your subscription has been cancelled. You'll continue to have access until the end of your billing period.</p>
        <p>If you change your mind, you can resubscribe anytime.</p>
      </div>
    `,
  });
}

// =============================================================================
// GET Health Check
// =============================================================================

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "maya-webhook",
    timestamp: new Date().toISOString(),
  });
}
