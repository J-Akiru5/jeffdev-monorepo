/**
 * Subscriptions API
 *
 * GET  /api/subscriptions - Get current subscription
 * POST /api/subscriptions - Create checkout for new subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";

/** Free-tier limit summary used when no subscription row exists yet. */
function freeLimits() {
  return {
    rules: TIER_LIMITS.free.rules,
    components: TIER_LIMITS.free.components,
    aiGenerations: TIER_LIMITS.free.aiGenerations,
  };
}

const PAYPAL_API_URL =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// Cache PayPal access token (valid for 8 hours, refresh at 7 hours)
let cachedPayPalToken: { token: string; expiresAt: number } | null = null;

async function getPayPalAccessToken(): Promise<string> {
  if (cachedPayPalToken && Date.now() < cachedPayPalToken.expiresAt) {
    return cachedPayPalToken.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(
      `PayPal auth failed: ${data.error || "no access_token in response"}`,
    );
  }

  cachedPayPalToken = {
    token: data.access_token,
    expiresAt: Date.now() + 7 * 60 * 60 * 1000, // 7 hours
  };

  return data.access_token;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  try {
    // Fetch subscription from database
    const { getPrismDb } = await import("@syntaxure-labs/db/prism");
    const db = getPrismDb();
    const { data: subscription } = await db
      .from("prism_subscriptions")
      .select("tier, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (!subscription) {
      // No subscription found, return free tier defaults
      return NextResponse.json({
        tier: "free" as SubscriptionTier,
        status: "active",
        limits: freeLimits(),
      });
    }

    // Return actual subscription data
    const tier = (subscription.tier as SubscriptionTier) || "free";
    const { TIER_LIMITS } = await import("@/lib/subscriptions");
    const limits = TIER_LIMITS[tier];

    return NextResponse.json({
      tier,
      status: subscription.status || "active",
      limits: {
        rules: limits.rules,
        components: limits.components,
        aiGenerations: limits.aiGenerations,
      },
    });
  } catch (error) {
    console.error("[subscriptions] GET error:", error);
    return NextResponse.json({
      tier: "free" as SubscriptionTier,
      status: "active",
      limits: freeLimits(),
    });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  try {
    const body = await request.json();
    const { tier, billing } = body as {
      tier: "pro" | "team" | "enterprise";
      billing: "monthly" | "annual";
    };

    if (!tier || !billing) {
      return NextResponse.json(
        { error: "Missing tier or billing period" },
        { status: 400 },
      );
    }

    if (tier === "enterprise") {
      // Enterprise requires manual contact
      return NextResponse.json({
        redirect: "/contact?subject=enterprise",
      });
    }

    const planId = getPlanId(tier, billing);

    if (!planId) {
      return NextResponse.json(
        { error: "Plan not configured" },
        { status: 400 },
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Create PayPal subscription
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          brand_name: "Prism Context Engine",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${process.env.NEXT_PUBLIC_PRISM_URL}/subscription/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_PRISM_URL}/subscription/cancelled`,
        },
        custom_id: userId, // Store user ID for webhook
      }),
    });

    const subscription = await response.json();

    if (!response.ok) {
      console.error("PayPal error:", subscription);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 },
      );
    }

    // Find approval URL
    const approvalLink = subscription.links?.find(
      (link: { rel: string }) => link.rel === "approve",
    );

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl: approvalLink?.href,
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 },
    );
  }
}

function getPlanId(
  tier: "pro" | "team",
  billing: "monthly" | "annual",
): string | null {
  const plans: Record<string, string | undefined> = {
    "pro-monthly": process.env.PAYPAL_PLAN_PRO_MONTHLY,
    "pro-annual": process.env.PAYPAL_PLAN_PRO_ANNUAL,
    "team-monthly": process.env.PAYPAL_PLAN_TEAM_MONTHLY,
    "team-annual": process.env.PAYPAL_PLAN_TEAM_ANNUAL,
  };

  return plans[`${tier}-${billing}`] || null;
}
