import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";

/**
 * MCP Search API
 * 
 * Searches video transcripts within a specific project.
 * Requires Pro+ subscription (ideSync feature).
 * 
 * GET /api/mcp/search?projectId=xxx&query=xxx
 */

const SearchParamsSchema = z.object({
  projectId: z.string().min(1, "projectId required"),
  query: z.string().min(1, "query required"),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  // 2. Check subscription tier
  const tier = await getUserTier(userId);
  const canUseIdeSync = TIER_LIMITS[tier].ideSync;

  if (!canUseIdeSync) {
    return NextResponse.json(
      { 
        error: "IDE Sync requires Pro subscription or higher",
        code: "UPGRADE_REQUIRED",
        currentTier: tier,
        requiredTier: "pro",
        upgradeUrl: "/subscription"
      },
      { status: 403 }
    );
  }

  // 3. Validate params
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = SearchParamsSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { projectId, query, limit } = parsed.data;

  try {
    // 4. Verify project belongs to user
    const projectsCollection = await getCollection("projects");
    
    // Try to find by slug first (most common), then by string ID
    const project = await projectsCollection.findOne({
      slug: projectId,
      userId
    }) || await projectsCollection.findOne({
      userId
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 5. Search video transcripts
    const transcriptsCollection = await getCollection("videoTranscripts");
    
    // Text search on transcript content
    const transcripts = await transcriptsCollection
      .find({
        projectId: project._id.toString(),
        transcriptText: { $regex: query, $options: "i" }
      })
      .limit(limit)
      .toArray();

    // 6. Extract matching segments
    const results = transcripts.map(transcript => {
      const text = transcript.transcriptText as string || "";
      const matches: { text: string; startIndex: number }[] = [];
      
      // Find all occurrences of the query
      const regex = new RegExp(query, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        // Get context around the match (50 chars before and after)
        const start = Math.max(0, match.index - 50);
        const end = Math.min(text.length, match.index + query.length + 50);
        const snippet = text.slice(start, end);
        
        matches.push({
          text: (start > 0 ? "..." : "") + snippet + (end < text.length ? "..." : ""),
          startIndex: match.index,
        });
      }

      return {
        videoId: transcript.muxAssetId,
        videoTitle: transcript.videoTitle || "Untitled Video",
        playbackId: transcript.muxPlaybackId,
        matches: matches.slice(0, 5), // Max 5 matches per video
        totalMatches: matches.length,
      };
    });

    return NextResponse.json({
      success: true,
      projectId: project._id.toString(),
      projectName: project.name,
      query,
      results,
      totalVideos: results.length,
      tier,
    });

  } catch (error) {
    console.error("[MCP Search] Error:", error);
    return NextResponse.json(
      { error: "Search failed", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * Get user's subscription tier
 */
async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    const subscriptionsCollection = await getCollection("subscriptions");
    const subscription = await subscriptionsCollection.findOne({ 
      userId,
      status: { $in: ["active", "trialing"] }
    });

    if (!subscription) {
      return "free";
    }

    return (subscription.tier as SubscriptionTier) || "free";
  } catch {
    return "free";
  }
}
