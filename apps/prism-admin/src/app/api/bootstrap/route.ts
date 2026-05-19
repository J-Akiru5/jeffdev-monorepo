/**
 * Bootstrap API - Set current user as founder
 * 
 * GET /api/bootstrap - Sets the authenticated user as founder in Clerk publicMetadata
 * 
 * ⚠️  DEVELOPMENT ONLY - Remove or protect in production
 */

import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Not authenticated. Please sign in first." },
      { status: 401 }
    );
  }

  // Check if in development mode
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const clerk = await clerkClient();
    
    // Update user's publicMetadata to set role as founder
    await clerk.users.updateUser(userId, {
      publicMetadata: {
        role: "founder",
      },
    });

    return NextResponse.json({
      success: true,
      message: "You are now a founder! Refresh the admin page to access it.",
      userId,
      role: "founder",
    });
  } catch (error) {
    console.error("[bootstrap] Error setting role:", error);
    return NextResponse.json(
      { error: "Failed to set role. Check Clerk API key configuration." },
      { status: 500 }
    );
  }
}
