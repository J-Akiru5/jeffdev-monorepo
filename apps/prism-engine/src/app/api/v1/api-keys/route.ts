import { NextRequest } from "next/server";
import { getCollection } from "@syntaxure-labs/db/cosmos";
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

  const apiKeys = await getCollection("apiKeys");
  const keys = await apiKeys
    .find({ userId: auth.userId, revokedAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .toArray();

  const limits =
    TIER_LIMITS[auth.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  const canCreate = limits.apiKeys === -1 || keys.length < limits.apiKeys;

  return successResponse({
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    })),
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

  const apiKeys = await getCollection("apiKeys");
  const existingCount = await apiKeys.countDocuments({
    userId: auth.userId,
    revokedAt: { $exists: false },
  });

  if (limits.apiKeys !== -1 && existingCount >= limits.apiKeys) {
    return errorResponse(
      `API key limit reached (${limits.apiKeys}). Revoke an existing key or upgrade.`,
      403,
    );
  }

  const { key, hash, prefix } = generateApiKey();
  const id = generateId();
  const now = new Date().toISOString();

  await apiKeys.insertOne({
    id,
    userId: auth.userId,
    keyHash: hash,
    keyPrefix: prefix,
    name: parsed.data.name,
    createdAt: now,
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
