import { NextRequest } from "next/server";
import { getCollection } from "@syntaxure-labs/db/cosmos";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  designSystem: z
    .enum([
      "jdstudio",
      "bare-minimum",
      "glassmorphic",
      "8bit-nostalgia",
      "keandrew",
      "custom",
    ])
    .optional(),
  stack: z.enum(["react", "nextjs", "react-native"]).optional(),
});

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

  const projectId = project._id.toString();
  const [rules, videos] = await Promise.all([
    getCollection("rules"),
    getCollection("videos"),
  ]);
  const [ruleCount, videoCount] = await Promise.all([
    rules.countDocuments({ projectId }),
    videos.countDocuments({ projectId }),
  ]);

  return successResponse({
    id: projectId,
    name: project.name,
    slug: project.slug,
    designSystem: project.designSystem,
    stack: project.stack,
    ruleCount,
    videoCount,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse("Invalid project ID", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = UpdateProjectSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  const projects = await getCollection("projects");
  const existing = await projects.findOne({
    _id: new ObjectId(id),
    userId: auth.userId,
  });
  if (!existing) return errorResponse("Project not found", 404);

  const updates = { ...parsed.data, updatedAt: new Date().toISOString() };
  await projects.updateOne({ _id: new ObjectId(id) }, { $set: updates });

  return successResponse({ id, ...existing, ...updates });
}

export async function DELETE(
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

  const projectId = project._id.toString();
  const [rulesColl] = await Promise.all([getCollection("rules")]);
  await Promise.all([
    rulesColl.deleteMany({ projectId }),
    projects.deleteOne({ _id: new ObjectId(id) }),
  ]);

  return successResponse({ id, deleted: true });
}
