import { NextResponse } from "next/server";
import { getTask, getTasks } from "@/app/actions/tasks";

/**
 * GET /api/tasks?id=<uuid>            → a single task
 * GET /api/tasks?workspaceId=<uuid>   → tasks scoped to a workspace
 * GET /api/tasks                      → all tasks for the authenticated user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    if (id) {
      const task = await getTask(id);
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      return NextResponse.json(task);
    }

    const workspaceId = searchParams.get("workspaceId") || undefined;
    const tasks = await getTasks(workspaceId);
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
