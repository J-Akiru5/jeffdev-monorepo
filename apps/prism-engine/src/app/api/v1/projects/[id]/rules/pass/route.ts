/**
 * GET /api/v1/projects/:id/rules/pass
 *
 * Read-only endpoint for `prism pull` (packages/prism-context-engine). Returns
 * this project's rules already shaped as a rules.json v1 envelope — the exact
 * `{ version: 1, rules: [...] }` contract `prism check` parses — so the CLI
 * can write the response straight to `.prism/rules.json` (after re-validating
 * it through the same parser, client-side, per its fail-safe contract).
 *
 * Deliberately NOT wrapped in the `successResponse()` `{ data, meta }`
 * envelope every other v1 route uses: this route's response body *is* the
 * file content, not a paginated resource listing.
 *
 * Auth: reuses the existing `authenticate()` (x-api-key or Supabase
 * session) — no new auth system, per the Pass setup pipeline scope.
 *
 * The prism_rules -> v1 PrismRule mapping (severity vocabulary, category
 * fold, pattern -> forbidden_pattern) lives in `@/lib/prism-rules-transform`
 * so it's unit-testable without mocking Supabase/Next.js.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { authenticate, errorResponse } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { toV1Rule, type PrismRulesRow } from "@/lib/prism-rules-transform";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  // The CLI hot path: ~4 DB ops/hit including a last_used_at write. Rate
  // limit like every other v1 route so a polling loop can't hammer Supabase.
  const rl = await checkRateLimit(`pass:${auth.userId}`, auth.tier);
  if (!rl.allowed) return errorResponse("Rate limit exceeded", 429, getRateLimitHeaders(rl));

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid project ID", 400);

  const db = getPrismDb();
  const { data: project } = await db
    .from("prism_projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!project) return errorResponse("Project not found", 404);

  const { data: rows } = await db
    .from("prism_rules")
    .select("id, name, description, content, category, severity, pattern")
    .eq("project_id", project.id)
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  const rules = (rows ?? []).map((row) => toV1Rule(row as PrismRulesRow));

  return NextResponse.json(
    { version: 1, rules },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
