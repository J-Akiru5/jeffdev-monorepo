import { logError } from "@/lib/log-error";
/**
 * POST /api/v1/sandbox/run — Phase 3 sandbox preview.
 *
 * Deterministic: parses the submitted rules.json v1 envelope with the REAL
 * Prism engine (prism-context-engine/rules) and reports what the Pass would
 * flag against sample files. No AI, no quota burn — but auth + burst limits
 * still apply because it executes user-supplied patterns server-side.
 */

import { NextRequest } from "next/server";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import {
  SandboxRequestSchema,
  SandboxValidationError,
  runSandbox,
} from "@/lib/sandbox";

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = await checkRateLimit(`sandbox:${auth.userId}`, "strict");
  if (!rl.allowed)
    return errorResponse("Rate limit exceeded", 429, getRateLimitHeaders(rl));

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = SandboxRequestSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((i) => i.message).join(", "),
      422,
    );

  try {
    const result = runSandbox(parsed.data);
    return successResponse(result);
  } catch (err) {
    if (err instanceof SandboxValidationError) {
      return errorResponse(err.message, 422);
    }
    logError("app/api/v1/sandbox/run/route", "[sandbox/run] unexpected error:", err);
    return errorResponse("Sandbox execution failed", 500);
  }
}
