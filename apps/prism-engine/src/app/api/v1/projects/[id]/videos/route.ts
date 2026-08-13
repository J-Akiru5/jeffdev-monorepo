import { NextRequest } from "next/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid project ID", 400);

  const db = getPrismDb();
  const { data: project } = await db
    .from("prism_projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!project) return errorResponse("Project not found", 404);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );

  const { data: itemsRaw, count } = await db
    .from("prism_videos")
    .select("_id:id, title, status, duration, transcript, createdAt:created_at", {
      count: "exact",
    })
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  const items = itemsRaw ?? [];
  const total = count ?? 0;

  return successResponse(
    items.map((v) => ({
      id: v._id.toString(),
      title: v.title,
      status: v.status,
      duration: v.duration,
      hasTranscript: !!v.transcript,
      createdAt: v.createdAt,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) },
  );
}
