/**
 * Mux Direct Upload API
 * 
 * POST /api/upload/mux
 * Creates a signed upload URL for direct browser uploads to Mux.
 * 
 * @security Clerk Auth required
 * @returns { url: string, id: string } - Signed upload URL and upload ID
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Mux from "@mux/mux-node";
import { z } from "zod";

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

/**
 * Optional schema for metadata passed with upload
 */
const UploadRequestSchema = z.object({
  projectId: z.string().optional(),
  title: z.string().max(200).optional(),
}).optional();

export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse optional body
    let metadata = {};
    try {
      const body = await request.json();
      const parsed = UploadRequestSchema.safeParse(body);
      if (parsed.success && parsed.data) {
        metadata = parsed.data;
      }
    } catch {
      // No body is fine for this endpoint
    }

    // Create Mux direct upload with auto-generated captions enabled
    // For direct uploads, generated_subtitles goes inside inputs array
    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXT_PUBLIC_PRISM_URL || "*",
      new_asset_settings: {
        playback_policies: ["public"],
        // For direct uploads, the first input slot is reserved for the uploaded file
        // generated_subtitles configuration tells Mux to auto-generate captions
        inputs: [
          {
            // Empty URL - the direct upload provides the video file
            generated_subtitles: [
              {
                language_code: "en",
                name: "English CC",
              },
            ],
          },
        ],
        // Store user context in passthrough for webhook processing
        passthrough: JSON.stringify({
          userId,
          ...metadata,
          uploadedAt: new Date().toISOString(),
        }),
      } as Record<string, unknown>,
    });

    console.log(`[Mux] Created upload ${upload.id} for user ${userId}`);

    return NextResponse.json({
      url: upload.url,
      id: upload.id,
    });

  } catch (error) {
    console.error("[Mux] Upload creation failed:", error);
    return NextResponse.json(
      { error: "Failed to initialize video upload" },
      { status: 500 }
    );
  }
}
