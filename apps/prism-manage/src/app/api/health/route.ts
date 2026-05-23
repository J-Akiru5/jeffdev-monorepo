import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "prism-manage",
    timestamp: new Date().toISOString(),
  });
}
