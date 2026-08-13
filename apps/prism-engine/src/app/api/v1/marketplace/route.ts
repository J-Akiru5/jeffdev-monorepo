import { NextRequest } from "next/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

const PublishSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  rules: z.array(z.string()).min(1),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );
  const search = searchParams.get("q");

  const db = getPrismDb();
  let query = db
    .from("prism_rule_sets")
    .select(
      "_id:id, name, description, ruleIds:rule_ids, createdBy:created_by, createdAt:created_at",
      { count: "exact" },
    )
    .eq("is_public", true);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: itemsRaw, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  const items = itemsRaw ?? [];
  const total = count ?? 0;

  return successResponse(
    items.map((rs) => ({
      id: rs._id.toString(),
      name: rs.name,
      description: rs.description,
      ruleCount: rs.ruleIds?.length || 0,
      createdBy: rs.createdBy,
      createdAt: rs.createdAt,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) },
  );
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

  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  if (!parsed.data.rules.every((id) => isValidId(id))) {
    return errorResponse("One or more rule IDs are invalid", 422);
  }

  const db = getPrismDb();
  const { data: existingRules } = await db
    .from("prism_rules")
    .select("id")
    .in("id", parsed.data.rules)
    .eq("created_by", auth.userId);
  if ((existingRules ?? []).length !== parsed.data.rules.length) {
    return errorResponse(
      "One or more rule IDs are invalid or do not belong to you",
      422,
    );
  }

  const now = new Date().toISOString();
  const { data: inserted, error } = await db
    .from("prism_rule_sets")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || "",
      rule_ids: parsed.data.rules,
      is_public: true,
      created_by: auth.userId,
      created_at: now,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return errorResponse("Failed to publish rule set", 500);
  }

  return successResponse(
    {
      id: inserted.id,
      name: parsed.data.name,
      description: parsed.data.description || "",
      rules: parsed.data.rules,
      isPublic: true,
      createdBy: auth.userId,
      createdAt: now,
    },
    { created: true },
  );
}
