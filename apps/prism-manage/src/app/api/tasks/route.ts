import { NextResponse } from "next/server";
import { getTasks } from "@/app/actions/tasks";

/**
 * GET /api/tasks
 * Returns all tasks for the authenticated user.
 */
export async function GET() {
  try {
    const tasks = await getTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
