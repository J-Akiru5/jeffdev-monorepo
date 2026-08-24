/**
 * GET /api/health — Phase 5: real subsystem checks.
 *
 * Verifies Supabase reachability (lightweight head-count query) and Upstash
 * Redis reachability (ping). Public booleans only — no counts, no error
 * text, no secrets. Consumed by prism CLI doctor, the prism-admin
 * SystemStatus badge, and external uptime pingers.
 *
 * Semantics: Supabase unreachable -> "degraded". Redis unconfigured passes
 * (feature absent, mirrors rate-limiter fail-open); configured-but-down ->
 * "degraded". Never throws.
 */

import { NextRequest, NextResponse } from "next/server";
import { buildHealthReport } from "@/lib/engine-health";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const report = await buildHealthReport();
  return NextResponse.json(report, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
