import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@jeffdev/db/cosmos";
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
    const apiKeysColl = await getCollection("apiKeys");
    const record = await apiKeysColl.findOne({
      keyHash: hash,
      revokedAt: null,
    });
    if (!record) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 },
      ) as NextResponse;
    }
    await apiKeysColl.updateOne(
      { _id: record._id },
      { $set: { lastUsedAt: new Date().toISOString() } },
    );
    const subscriptions = await getCollection("subscriptions");
    const sub = await subscriptions.findOne({ userId: record.userId });
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

  const subscriptions = await getCollection("subscriptions");
  const sub = await subscriptions.findOne({ userId: user.id });
  const tier = (sub?.tier as string) || "free";

  return { userId: user.id, tier, source: "supabase" };
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) });
}
