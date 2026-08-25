import { logError } from "@/lib/log-error";
/**
 * POST /api/v1/sandbox/run — Phase 3 sandbox preview, Phase 4.5 boundary.
 *
 * Deterministic: evaluates the submitted rules.json v1 envelope with the
 * REAL Prism engine running as a SUBPROCESS (arm's-length from this
 * process; hard-killed on timeout). No AI, no quota burn — but auth +
 * burst limits still apply because it executes user-supplied patterns
 * server-side.
 *
 * Error mapping:
 *   invalid envelope / rejected pattern -> 422 (with reason)
 *   evaluator timeout                   -> 504
 *   spawn/malformed/child failure       -> 500 (logged)
 */

import { NextRequest } from "next/server";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import {
  SandboxRejectedPatternError,
  SandboxRequestSchema,
  SandboxSpawnError,
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
    const result = await runSandbox(parsed.data);
    return successResponse(result);
  } catch (err) {
    if (err instanceof SandboxValidationError) {
      return errorResponse(err.message, 422);
    }
    if (err instanceof SandboxRejectedPatternError) {
      return errorResponse(err.message, 422);
    }
    if (err instanceof SandboxSpawnError && err.code === "TIMEOUT") {
      logError(
        "app/api/v1/sandbox/run/route",
        "evaluation timed out and was killed",
        { timeoutMs: err.message },
      );
      return errorResponse(
        "Sandbox evaluation timed out and was killed. Simplify or split your rules.",
        504,
      );
    }
    logError("app/api/v1/sandbox/run/route", "[sandbox/run] spawn error:", err);
    return errorResponse("Sandbox execution failed", 500);
  }
}
