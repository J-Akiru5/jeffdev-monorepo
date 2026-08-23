/**
 * POST /api/v1/rules/creator — Phase 3 rules creator.
 *
 * Plain-language convention description in, a validated rules.json v1 rule
 * candidate out (with a compiling check.pattern when the convention is
 * mechanically checkable). Does NOT save anything — the caller reviews and
 * saves through the normal create flows. AI spend is quota-tracked.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  authenticate,
  errorResponse,
  successResponse,
} from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { generateChatCompletion } from "@/lib/ai-router";
import { claimAiGeneration, refundAiGeneration } from "@/lib/usage";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";
import {
  buildCreatorPrompt,
  parseCreatorRule,
} from "@/lib/rule-creator";

const BodySchema = z.object({
  description: z.string().min(10).max(2000),
  model: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  // AI spend guard: strict burst + monthly quota claim with refund.
  const rl = await checkRateLimit(`creator:${auth.userId}`, "strict");
  if (!rl.allowed)
    return errorResponse("Rate limit exceeded", 429, getRateLimitHeaders(rl));

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((i) => i.message).join(", "),
      422,
    );

  const tier = auth.tier as SubscriptionTier;
  if (TIER_LIMITS[tier].aiGenerations === 0) {
    return errorResponse(
      "AI features are not included in your plan. Upgrade to Pro to use the rules creator.",
      403,
    );
  }

  const claimed = await claimAiGeneration(auth.userId);
  if (
    TIER_LIMITS[tier].aiGenerations !== -1 &&
    claimed !== null &&
    claimed > TIER_LIMITS[tier].aiGenerations
  ) {
    await refundAiGeneration(auth.userId);
    return errorResponse("Monthly AI generation limit reached.", 403);
  }

  try {
    const prompt = buildCreatorPrompt(parsed.data.description);
    const raw = await generateChatCompletion({
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      temperature: 0.2,
      maxTokens: 1200,
      responseFormat: "json_object",
      model: parsed.data.model,
    });

    const rule = parseCreatorRule(raw);
    return successResponse({ rule }, { model: parsed.data.model ?? null });
  } catch (err) {
    // Refund: our failures are not the user's AI spend.
    await refundAiGeneration(auth.userId);
    console.error("[rules/creator] generation failed:", err);
    return errorResponse(
      `Could not generate a rule: ${(err as Error).message}`,
      502,
    );
  }
}
