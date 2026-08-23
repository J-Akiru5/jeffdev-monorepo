/**
 * Shared AI-generation quota helpers (Phase 1/3).
 *
 * Uses the atomic bump_prism_ai_generations RPC (migration
 * 20260823000002) — claim BEFORE work, refund on failure. Never throws:
 * quota enforcement degrades to the caller's preflight when the RPC is
 * unavailable.
 */

import { getPrismDb } from "@syntaxure-labs/db/prism";

/** Returns the new monthly counter value, or null if the RPC is unavailable. */
export async function bumpAiGenerations(
  userId: string,
  delta: number,
): Promise<number | null> {
  try {
    const db = getPrismDb();
    const { data, error } = await db.rpc("bump_prism_ai_generations", {
      p_user_id: userId,
      p_delta: delta,
    });
    if (error) throw error;
    return typeof data === "number" ? data : null;
  } catch {
    return null;
  }
}

export async function claimAiGeneration(userId: string): Promise<number | null> {
  return bumpAiGenerations(userId, 1);
}

export async function refundAiGeneration(userId: string): Promise<void> {
  await bumpAiGenerations(userId, -1);
}
