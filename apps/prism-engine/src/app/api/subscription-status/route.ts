/**
 * Subscription Status API
 *
 * GET /api/subscription-status
 * Polls subscription status after payment redirect.
 * Used by success page to confirm webhook processed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get("subscriptionId");

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "Missing subscriptionId parameter" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check subscription status in Cosmos DB
    const { getCollection } = await import("@syntaxure-labs/db");
    const subscriptions = await getCollection("subscriptions");
    const subscription = await subscriptions.findOne({ userId: user.id });

    if (!subscription) {
      return NextResponse.json({
        status: "pending",
        tier: "free",
        message: "Subscription not yet activated. Waiting for webhook.",
      });
    }

    // Check if this is the subscription we're waiting for
    if (
      subscription.paypalSubscriptionId === subscriptionId ||
      subscription.status === "active"
    ) {
      return NextResponse.json({
        status: subscription.status,
        tier: subscription.tier,
        message:
          subscription.status === "active"
            ? "Subscription activated successfully!"
            : "Subscription pending.",
      });
    }

    return NextResponse.json({
      status: "pending",
      tier: subscription.tier || "free",
      message: "Waiting for webhook confirmation.",
    });
  } catch (error) {
    console.error("[subscription-status] Error:", error);
    return NextResponse.json({
      status: "pending",
      tier: "free",
      message: "Checking status...",
    });
  }
}
