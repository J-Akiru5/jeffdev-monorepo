/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Used by `prism doctor` to verify Prism Cloud is reachable.
 * Returns 200 if the server is up; does not require authentication.
 */

import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf-8"),
    );
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "prism-engine",
    version: getVersion(),
    timestamp: new Date().toISOString(),
  });
}
