import { logError } from "@/lib/log-error";
/**
 * POST /api/skills/generate — Phase 3 skills creator.
 *
 * Replaces the "Generate Skill — Coming Soon" screen: describe a workflow,
 * get a step-by-step procedural guide saved into the project's prism_skills
 * (steps as structured JSONB). AI spend is quota-tracked with claim/refund.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  claimAiGeneration,
  refundAiGeneration,
} from "@/lib/usage";
import { TIER_LIMITS, getUserTier } from "@/lib/subscriptions";
import { generateChatCompletion } from "@/lib/ai-router";

const BodySchema = z.object({
  projectSlug: z.string().min(1),
  description: z.string().min(10).max(2000),
});

const StepSchema = z.object({
  title: z.string().min(1).max(200),
  action: z.string().min(1).max(2000),
  done: z.string().max(500).default(""),
});

const GeneratedSkillSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).default(""),
  steps: z.array(StepSchema).min(1).max(30),
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

  const rl = await checkRateLimit(`skills-gen:${userId}`, "strict");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Slow down and try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 422 },
    );
  }

  const userTier = await getUserTier(userId);
  if (TIER_LIMITS[userTier].aiGenerations === 0) {
    return NextResponse.json(
      {
        error:
          "AI features are not included in your plan. Upgrade to Pro to use the skills creator.",
      },
      { status: 403 },
    );
  }

  const db = getPrismDb();

  // Ownership guard — only generate into a project the caller owns.
  const { data: project } = await db
    .from("prism_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", parsed.data.projectSlug)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const claimed = await claimAiGeneration(userId);
  if (
    TIER_LIMITS[userTier].aiGenerations !== -1 &&
    claimed !== null &&
    claimed > TIER_LIMITS[userTier].aiGenerations
  ) {
    await refundAiGeneration(userId);
    return NextResponse.json(
      { error: "Monthly AI generation limit reached." },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();

  try {
    const raw = await generateChatCompletion({
      systemPrompt:
        "You document developer workflows for AI coding agents as executable skill files. Respond with ONLY a JSON object:\n" +
        '{"name":string(3-100 chars, Title Case),"description":string(one sentence),' +
        '"steps":[{"title":string,"action":string(exact action incl. files/commands),"done":string(how the agent knows this step is complete)}]}\n\n' +
        "Steps must be mechanical and ordered. No preamble, no closing prose.",
      userPrompt: `Workflow description:\n${parsed.data.description}`,
      temperature: 0.2,
      maxTokens: 2500,
      responseFormat: "json_object",
    });

    // Defensive parse — reasoning models sometimes wrap JSON in fences.
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    let doc: unknown;
    try {
      doc = JSON.parse(stripped);
    } catch {
      throw new Error("Model returned invalid JSON");
    }

    const result = GeneratedSkillSchema.safeParse(doc);
    if (!result.success) {
      throw new Error(
        `Generated skill failed validation: ${result.error.issues
          .map((i) => i.message)
          .join(", ")}`,
      );
    }

    const { data: inserted, error: insertError } = await db
      .from("prism_skills")
      .insert({
        project_id: project.id,
        created_by: userId,
        name: result.data.name,
        description: result.data.description,
        category: "custom",
        steps: result.data.steps,
        tags: ["ai-generated"],
        source: "manual",
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message || "Failed to save skill");
    }

    return NextResponse.json({
      success: true,
      skillId: inserted.id,
      name: result.data.name,
      stepCount: result.data.steps.length,
    });
  } catch (err) {
    await refundAiGeneration(userId);
    logError("app/api/skills/generate/route", "[skills/generate] failed:", err);
    return NextResponse.json(
      { error: `Could not generate the skill: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
