import { NextRequest } from "next/server";
import { getCollection } from "@syntaxure-labs/db/cosmos";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) return errorResponse("Key ID is required", 400);

  const apiKeys = await getCollection("apiKeys");
  const existing = await apiKeys.findOne({ id, userId: auth.userId });
  if (!existing) return errorResponse("API key not found", 404);
  if (existing.revokedAt) return errorResponse("API key already revoked", 400);

  await apiKeys.updateOne(
    { id, userId: auth.userId },
    { $set: { revokedAt: new Date().toISOString() } },
  );

  return successResponse({ id, revoked: true });
}
