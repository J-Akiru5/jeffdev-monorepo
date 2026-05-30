/**
 * Subscription Checkout
 *
 * GET /api/subscriptions/checkout?tier=pro|team
 *
 * In development: Directly activates the subscription (no payment required)
 * In production: Initiates PayPal checkout flow
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@syntaxure-labs/db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const userId = user.id;

  const tier = request.nextUrl.searchParams.get("tier");

  if (!tier || !["pro", "team"].includes(tier)) {
    return NextResponse.redirect(new URL("/subscription", request.url));
  }

  const isDev = process.env.NODE_ENV === "development";

  // DEV MODE: Directly activate subscription (no PayPal required)
  if (isDev) {
    try {
      const subscriptionsCollection = await getCollection("subscriptions");

      // Upsert the subscription
      await subscriptionsCollection.updateOne(
        { userId },
        {
          $set: {
            userId,
            tier,
            status: "active",
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );

      console.log(
        `[DEV MODE] Activated ${tier} subscription for user ${userId}`,
      );

      // Redirect to subscription page with success message
      const url = new URL("/subscription", request.url);
      url.searchParams.set("checkout", tier);
      url.searchParams.set("status", "success");

      return NextResponse.redirect(url);
    } catch (error) {
      console.error("[Checkout] Dev mode error:", error);
      const url = new URL("/subscription", request.url);
      url.searchParams.set("status", "error");
      return NextResponse.redirect(url);
    }
  }

  // PRODUCTION: Payment integration coming soon
  const url = new URL("/subscription", request.url);
  url.searchParams.set("checkout", tier);
  url.searchParams.set("status", "pending");
  url.searchParams.set(
    "message",
    "Payment integration is coming soon. Enjoy Pro features free during the beta period.",
  );

  return NextResponse.redirect(url);
}
