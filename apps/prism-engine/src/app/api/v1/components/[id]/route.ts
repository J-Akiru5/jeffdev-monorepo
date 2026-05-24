import { NextRequest } from "next/server";
import { getCollection } from "@jeffdev/db/cosmos";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const components = await getCollection("components");
  const component = await components.findOne({ id, userId: auth.userId });
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
