import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import crypto from "crypto";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";
import { TIER_LIMITS } from "@/lib/subscriptions";

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(24).toString("base64url");
  const key = `pk_live_${randomBytes}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = key.substring(0, 12);
  return { key, hash, prefix };
}

function generateId(): string {
  return `key_${crypto.randomBytes(12).toString("hex")}`;
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const db = getPrismDb();
  const { data: keys } = await db
    .from("prism_api_keys")
    .select(
      "id, name, keyPrefix:key_prefix, lastUsedAt:last_used_at, createdAt:created_at",
    )
    .eq("user_id", auth.userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  const items = keys ?? [];

  const limits =
    TIER_LIMITS[auth.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  const canCreate = limits.apiKeys === -1 || items.length < limits.apiKeys;

  return successResponse({
    keys: items,
    limit: limits.apiKeys,
    canCreate,
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = z.object({ name: z.string().min(1).max(50) }).safeParse(body);
  if (!parsed.success)
    return errorResponse("Name is required (max 50 chars)", 422);

  const limits =
    TIER_LIMITS[auth.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  if (limits.apiKeys === 0)
    return errorResponse("API keys not available on your plan", 403);

  const db = getPrismDb();
  const { count: existingCount } = await db
    .from("prism_api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .is("revoked_at", null);

  if (limits.apiKeys !== -1 && (existingCount ?? 0) >= limits.apiKeys) {
    return errorResponse(
      `API key limit reached (${limits.apiKeys}). Revoke an existing key or upgrade.`,
      403,
    );
  }

  const { key, hash, prefix } = generateApiKey();
  const id = generateId();
  const now = new Date().toISOString();

  await db.from("prism_api_keys").insert({
    id,
    user_id: auth.userId,
    key_hash: hash,
    key_prefix: prefix,
    name: parsed.data.name,
    created_at: now,
  });

  return successResponse(
    {
      id,
      name: parsed.data.name,
      key,
      keyPrefix: prefix,
      createdAt: now,
      message: "Copy this key now. It will not be shown again.",
    },
    { created: true },
  );
}
