import { NextRequest } from "next/server";
import { getCollection } from "@syntaxure-labs/db/cosmos";
import { ObjectId } from "mongodb";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse("Invalid project ID", 400);

  const projects = await getCollection("projects");
  const project = await projects.findOne({
    _id: new ObjectId(id),
    userId: auth.userId,
  });
  if (!project) return errorResponse("Project not found", 404);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );

  const videos = await getCollection("videos");
  const projectId = project._id.toString();
  const query = { projectId };

  const total = await videos.countDocuments(query);
  const items = await videos
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

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
