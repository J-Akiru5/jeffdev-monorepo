import { logError } from "@/lib/log-error";
/**
 * Component Generation API
 *
 * POST /api/generate
 * Generates a component using Gemini AI
 *
 * @security Supabase Auth + Zod Validation
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import crypto from "crypto";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { generateComponent, generateRulesFromComponent } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  claimAiGeneration,
  refundAiGeneration,
} from "@/lib/usage";
import { TIER_LIMITS, getUserTier, type SubscriptionTier } from "@/lib/subscriptions";

async function getMonthlyUsage(userId: string): Promise<number> {
  try {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const db = getPrismDb();
    const { data: record } = await db
      .from("prism_usage")
      .select("aiGenerations:ai_generations")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();
    return (record?.aiGenerations as number) || 0;
  } catch {
    return 0;
  }
}

/**
 * 🛡️ Zod Gate - Input Validation Schema
 * Validates input types match the generateComponent function requirements.
 */
const GenerateRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt cannot be empty")
    .max(5000, "Prompt too long (max 5000 chars)"),
  designSystem: z.enum([
    "jdstudio",
    "bare-minimum",
    "glassmorphic",
    "8bit-nostalgia",
  ]),
  stack: z.enum(["react", "nextjs", "react-native"]),
  generateRules: z.boolean().optional().default(false),
});

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

    // 🛡️ The Guard - Zod Validation
    const parsed = GenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { prompt, designSystem, stack, generateRules } = parsed.data;

    // 🔑 Pre-flight: verify GEMINI_API_KEY exists
    if (!process.env.GEMINI_API_KEY) {
      logError("app/api/generate/route", "[Generate] GEMINI_API_KEY is not set in environment");
      return NextResponse.json(
        { error: "AI service is not configured. Please contact support." },
        { status: 503 },
      );
    }

    const tier = await getUserTier(userId);

    // Burst ceiling alongside the monthly quota — the quota alone allowed a
    // subscriber to burn their whole month in one burst window.
    const burst = await checkRateLimit(`generate:${userId}`, tier);
    if (!burst.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Slow down and try again shortly." },
        { status: 429 },
      );
    }

    const monthlyUsage = await getMonthlyUsage(userId);
    const limit = TIER_LIMITS[tier].aiGenerations;
    if (limit !== -1 && monthlyUsage >= limit) {
      return NextResponse.json(
        {
          error: `Monthly AI generation limit reached (${limit}/month). Upgrade to Pro for more.`,
        },
        { status: 403 },
      );
    }

    // Atomic claim BEFORE generation: the RPC increments month usage in one
    // server-side step, closing the concurrent-request race. If the claim
    // itself crosses the limit (preflight raced), refund and reject.
    const claimed = await claimAiGeneration(userId);
    if (limit !== -1 && claimed !== null && claimed > limit) {
      await refundAiGeneration(userId);
      return NextResponse.json(
        {
          error: `Monthly AI generation limit reached (${limit}/month). Upgrade to Pro for more.`,
        },
        { status: 403 },
      );
    }

    // Generate component
    let component;
    try {
      component = await generateComponent({
        prompt,
        designSystem,
        stack,
      });
    } catch (genError) {
      // Refund: failed generations must not consume quota.
      await refundAiGeneration(userId);
      logError("app/api/generate/route", "[Generate] Gemini API error:", genError);
      const message =
        genError instanceof Error ? genError.message : "Unknown Gemini error";
      return NextResponse.json(
        { error: `AI generation failed: ${message}` },
        { status: 502 },
      );
    }

    // Optionally generate rules
    let rules = null;
    if (generateRules && component.code) {
      try {
        const componentName =
          extractComponentName(component.code) || "Component";
        const rulesResult = await generateRulesFromComponent({
          componentCode: component.code,
          componentName,
        });
        rules = rulesResult.rules;
      } catch (rulesError) {
        // Don't fail the whole request if rules generation fails
        logError("app/api/generate/route", "[Generate] Rules generation failed:", rulesError);
      }
    }

    // Log generation for usage tracking
    try {
      const db = getPrismDb();
      await db.from("prism_generations").insert({
        id: `gen_${crypto.randomBytes(12).toString("hex")}`,
        user_id: userId,
        type: "component",
        prompt: prompt.slice(0, 200), // Store first 200 chars of prompt
      });
    } catch (logFailure) {
      // Don't fail the request if logging fails
      logError("app/api/generate/route", "[Generate] Failed to log generation:", logFailure);
    }

    return NextResponse.json({
      success: true,
      component,
      rules,
    });
  } catch (error) {
    logError("app/api/generate/route", "[Generate] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate component: ${message}` },
      { status: 500 },
    );
  }
}

function extractComponentName(code: string): string | null {
  // Match: export function ComponentName or export const ComponentName
  const match = code.match(/export\s+(?:function|const)\s+(\w+)/);
  return match ? match[1]! : null;
}
