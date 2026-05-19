import { NextResponse } from "next/server";

/**
 * PayPal Webhook Handler
 * Receives IPN notifications for subscription events
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    // Verify webhook with PayPal
    const verifyResponse = await fetch(
      `${process.env.PAYPAL_API_URL || "https://ipnpb.paypal.com/cgi-bin/webscr"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `cmd=_notify-validate&${body}`,
      }
    );

    const verification = await verifyResponse.text();

    if (verification !== "VERIFIED") {
      console.error("[PayPal Webhook] Verification failed:", verification);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse event
    const eventType = params.get("txn_type") || params.get("event_type");
    const subscriptionId = params.get("subscr_id") || params.get("recurring_payment_id");
    const payerEmail = params.get("payer_email");
    const payerId = params.get("payer_id");
    const amount = params.get("mc_gross") || params.get("amount");
    const currency = params.get("mc_currency") || "USD";
    const status = params.get("payment_status");

    console.log("[PayPal Webhook] Event received:", {
      eventType,
      subscriptionId,
      payerEmail,
      status,
    });

    // Handle different event types
    switch (eventType) {
      case "subscr_signup":
      case "recurring_payment_profile_created":
        // New subscription created
        // TODO: Create subscription record in Cosmos DB
        // TODO: Update user tier to "pro" or "team"
        console.log("[PayPal] New subscription:", subscriptionId);
        break;

      case "subscr_payment":
      case "recurring_payment":
        // Successful recurring payment
        // TODO: Update subscription status and next billing date
        console.log("[PayPal] Payment received:", amount, currency);
        break;

      case "subscr_cancel":
      case "recurring_payment_profile_cancel":
        // Subscription canceled
        // TODO: Mark subscription as canceled
        // TODO: Set user tier back to "free" at period end
        console.log("[PayPal] Subscription canceled:", subscriptionId);
        break;

      case "subscr_eot":
        // Subscription expired/ended
        // TODO: Update user tier to "free"
        console.log("[PayPal] Subscription ended:", subscriptionId);
        break;

      case "subscr_failed":
      case "recurring_payment_failed":
        // Payment failed
        // TODO: Mark subscription as past_due
        // TODO: Send notification email via Resend
        console.log("[PayPal] Payment failed:", subscriptionId);
        break;

      case "subscr_modify":
        // Subscription plan changed
        // TODO: Update subscription plan and amount
        console.log("[PayPal] Subscription modified:", subscriptionId);
        break;

      default:
        console.log("[PayPal] Unhandled event type:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PayPal Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// PayPal webhooks don't use GET, but we'll return a health check
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    webhook: "paypal",
    timestamp: new Date().toISOString() 
  });
}
