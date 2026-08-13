import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { authenticate, successResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );
  const modifiedAfter = searchParams.get("modifiedAfter");

  const db = getPrismDb();
  let query = db
    .from("prism_components")
    .select(
      "id, name, description, designSystem:design_system, stack, createdAt:created_at",
      { count: "exact" },
    )
    .eq("user_id", auth.userId);
  if (modifiedAfter) query = query.gte("updated_at", modifiedAfter);

  const { data: itemsRaw, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  const items = itemsRaw ?? [];
  const total = count ?? 0;

  return successResponse(items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
