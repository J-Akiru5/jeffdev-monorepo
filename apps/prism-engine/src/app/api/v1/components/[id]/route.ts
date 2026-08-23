import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const db = getPrismDb();
  const { data: component } = await db
    .from("prism_components")
    .select(
      "id, name, description, code, rules, designSystem:design_system, stack, createdAt:created_at, updatedAt:updated_at",
    )
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!component) return errorResponse("Component not found", 404);

  return successResponse({
    id: component.id,
    name: component.name,
    description: component.description,
    code: component.code,
    rules: component.rules,
    designSystem: component.designSystem,
    stack: component.stack,
    createdAt: component.createdAt,
    updatedAt: component.updatedAt,
  });
}
