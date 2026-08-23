import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { createHash } from "crypto";

interface AuthResult {
  userId: string;
  tier: string;
  source: "supabase" | "api_key";
}

export async function authenticate(
  request: Request,
): Promise<AuthResult | NextResponse> {
  const apiKey = request.headers.get("x-api-key");

  if (apiKey) {
    const hash = createHash("sha256").update(apiKey).digest("hex");
    const db = getPrismDb();
    const { data: record } = await db
      .from("prism_api_keys")
      .select("id, userId:user_id")
      .eq("key_hash", hash)
      .is("revoked_at", null)
      .maybeSingle();
    if (!record) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 },
      ) as NextResponse;
    }
    await db
      .from("prism_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", record.id);
    const { data: sub } = await db
      .from("prism_subscriptions")
      .select("tier")
      .eq("user_id", record.userId)
      .maybeSingle();
    return {
      userId: record.userId,
      tier: (sub?.tier as string) || "free",
      source: "api_key",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    ) as NextResponse;
  }

  const db = getPrismDb();
  const { data: sub } = await db
    .from("prism_subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .maybeSingle();
  const tier = (sub?.tier as string) || "free";

  return { userId: user.id, tier, source: "supabase" };
}

export function errorResponse(
  message: string,
  status: number = 400,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error: message },
    { status, ...(headers ? { headers } : {}) },
  );
}

export function successResponse(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) });
}
