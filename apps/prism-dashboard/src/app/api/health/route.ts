/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Used by `prism doctor` to verify Prism Cloud is reachable.
 * Returns 200 if the server is up; does not require authentication.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "prism-dashboard",
    version: "1.1.0",
    timestamp: new Date().toISOString(),
  });
}
