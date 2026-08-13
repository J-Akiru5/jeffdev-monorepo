import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) return errorResponse("Key ID is required", 400);

  const db = getPrismDb();
  const { data: existing } = await db
    .from("prism_api_keys")
    .select("id, revokedAt:revoked_at")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!existing) return errorResponse("API key not found", 404);
  if (existing.revokedAt) return errorResponse("API key already revoked", 400);

  await db
    .from("prism_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.userId);

  return successResponse({ id, revoked: true });
}
