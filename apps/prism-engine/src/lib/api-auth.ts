import { NextResponse } from "next/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUrlAndKey } from "@/lib/supabase/env";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { createHash } from "crypto";

interface AuthResult {
  userId: string;
  tier: string;
  source: "supabase" | "api_key";
}

/**
 * Verify a session JWT directly against Supabase's auth server via an
 * anon-key client (getUser(jwt) overload) — no cookies involved. This is
 * what lets the Prism CLI authenticate from any machine with
 * `prism login --token <token>`.
 *
 * The anon key is a public client key; Supabase validates the JWT itself.
 */
export async function verifyBearerJwt(
  jwt: string,
): Promise<{ id: string } | null> {
  const { url, key } = getSupabaseUrlAndKey();
  if (!url || !key) return null;
  const supabase = createAnonClient(url, key);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(jwt);
  if (error || !user) return null;
  return { id: user.id };
}

export async function authenticate(
  request: Request,
): Promise<AuthResult | NextResponse> {
  const apiKey = request.headers.get("x-api-key");

  // API-key path — unchanged, byte-for-byte the same behavior as before.
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
      // Only an active/trialing subscription grants its tier — a cancelled or
      // past-due row must fall back to free (matches getUserTier semantics).
      .in("status", ["active", "trialing"])
      .maybeSingle();
    return {
      userId: record.userId,
      tier: (sub?.tier as string) || "free",
      source: "api_key",
    };
  }

  // Session path: Authorization: Bearer <jwt> first (CLI), cookies second
  // (browser). Both resolve to a Supabase user and behave identically
  // downstream — the dashboard's RLS/created_by semantics apply the same.
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
    if (match) {
      const user = await verifyBearerJwt(match[1]!.trim());
      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        ) as NextResponse;
      }
      const { data: sub } = await getPrismDb()
        .from("prism_subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();
      return {
        userId: user.id,
        tier: (sub?.tier as string) || "free",
        source: "supabase",
      };
    }
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
    .in("status", ["active", "trialing"])
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