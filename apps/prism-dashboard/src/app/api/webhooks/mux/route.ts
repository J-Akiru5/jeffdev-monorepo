/**
 * Mux Webhook Handler
 * 
 * POST /api/webhooks/mux
 * Receives events from Mux when video processing completes.
 * When transcript is ready, we extract it and create Rules using Azure OpenAI.
 * 
 * @webhook video.asset.ready - Asset fully processed
 * @webhook video.asset.track.ready - Subtitle track ready (transcript)
 */

import { NextResponse } from "next/server";
import { getCollection } from "@jeffdev/db";
import { z } from "zod";
import { fetchMuxTranscript } from "@/lib/mux-transcript";
import { extractRulesFromTranscript, generateEmbedding } from "@/lib/azure-openai";

/**
 * Mux Webhook Event Schema (partial - only what we need)
 */
const MuxWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    asset_id: z.string().optional(),
    playback_ids: z.array(z.object({
      id: z.string(),
      policy: z.string(),
    })).optional(),
    tracks: z.array(z.object({
      id: z.string(),
      type: z.string(),
      text_type: z.string().optional(),
      language_code: z.string().optional(),
    })).optional(),
    passthrough: z.string().optional(),
    type: z.string().optional(), // For track events: "text"
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate webhook payload
    const parsed = MuxWebhookSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[Mux Webhook] Invalid payload:", parsed.error.flatten());
      // Still return 200 to acknowledge receipt (Mux best practice)
      return NextResponse.json({ received: true, valid: false });
    }

    const event = parsed.data;
    console.log(`[Mux Webhook] Received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "video.asset.ready":
        await handleAssetReady(event.data);
        break;
        
      case "video.asset.track.ready":
        // This fires when the auto-generated subtitle track is ready
        if (event.data.type === "text") {
          await handleTrackReady(event.data);
        }
        break;
        
      default:
        console.log(`[Mux Webhook] Ignoring event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("[Mux Webhook] Error processing event:", error);
    // Return 200 anyway to prevent Mux retries for app errors
    return NextResponse.json({ received: true, error: "Processing failed" });
  }
}

/**
 * Handle video.asset.ready event
 * Video is fully processed, but we wait for the transcript track
 */
async function handleAssetReady(data: z.infer<typeof MuxWebhookSchema>["data"]) {
  console.log(`[Mux] Asset ready: ${data.id}`);
  
  // Parse passthrough data
  let metadata: Record<string, unknown> = {};
  if (data.passthrough) {
    try {
      metadata = JSON.parse(data.passthrough);
    } catch {
      console.warn("[Mux] Failed to parse passthrough data");
    }
  }

  // Log for debugging - actual rule creation happens when transcript is ready
  console.log(`[Mux] Asset ${data.id} belongs to user: ${metadata.userId || "unknown"}`);
}

/**
 * Handle video.asset.track.ready event (TRANSCRIPT READY)
 * This is where we fetch the transcript, process it with Azure OpenAI,
 * and create Rules + VideoTranscript documents
 */
async function handleTrackReady(data: z.infer<typeof MuxWebhookSchema>["data"]) {
  const assetId = data.asset_id;
  const trackId = data.id;
  
  if (!assetId || !trackId) {
    console.error("[Mux] Missing asset_id or track id in track.ready event");
    return;
  }
  
  console.log(`[Mux] Text track ready for asset ${assetId}, track ${trackId}`);

  try {
    // Parse passthrough metadata
    let metadata: { userId?: string; projectId?: string; videoTitle?: string } = {};
    if (data.passthrough) {
      try {
        metadata = JSON.parse(data.passthrough);
      } catch {
        console.warn("[Mux] Failed to parse passthrough data");
      }
    }

    // Step 1: Fetch transcript from Mux
    console.log(`[Mux] Fetching transcript...`);
    const transcript = await fetchMuxTranscript(assetId, trackId);
    
    // Step 2: Extract rules using Azure OpenAI
    console.log(`[Mux] Processing transcript with Azure OpenAI (${transcript.fullText.length} chars)...`);
    const videoTitle = metadata.videoTitle || `Video ${assetId.slice(0, 8)}`;
    const aiResult = await extractRulesFromTranscript(
      transcript.fullText,
      videoTitle,
      metadata.projectId
    );
    
    console.log(`[Mux] ✅ Extracted ${aiResult.rules.length} rules (confidence: ${aiResult.confidence})`);

    // Step 2.5: Generate embedding for semantic search
    console.log(`[Mux] Generating embedding for semantic search...`);
    const embedding = await generateEmbedding(transcript.fullText);
    console.log(`[Mux] ✅ Generated ${embedding.length}-dimensional embedding`);

    // Step 3: Store VideoTranscript document
    const transcriptsCollection = await getCollection("videoTranscripts");
    const playbackId = data.playback_ids?.[0]?.id;
    
    const videoTranscript = {
      muxAssetId: assetId,
      muxPlaybackId: playbackId || '',
      videoTitle,
      transcriptText: transcript.fullText,
      segments: transcript.segments,
      duration: transcript.duration,
      language: transcript.language || 'en',
      embedding, // Add vector embedding for semantic search
      extractedRules: [], // Will populate with rule IDs after inserting rules
      userId: metadata.userId,
      projectId: metadata.projectId,
      processingTime: aiResult.processingTime,
      confidence: aiResult.confidence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const transcriptResult = await transcriptsCollection.insertOne(videoTranscript);
    console.log(`[Mux] ✅ Saved VideoTranscript: ${transcriptResult.insertedId}`);

    // Step 4: Insert extracted rules into Cosmos DB
    if (aiResult.rules.length > 0) {
      const rulesCollection = await getCollection("rules");
      const extractedRuleIds: string[] = [];
      
      for (const extractedRule of aiResult.rules) {
        const rule = {
          name: extractedRule.title,
          description: extractedRule.description,
          category: extractedRule.category,
          tags: extractedRule.tags,
          priority: extractedRule.priority,
          content: `## ${extractedRule.title}

${extractedRule.description}

${extractedRule.examples?.good || extractedRule.examples?.bad ? '### Examples\n' : ''}${extractedRule.examples?.good ? `**✅ Good:**\n\`\`\`\n${extractedRule.examples.good}\n\`\`\`\n\n` : ''}${extractedRule.examples?.bad ? `**❌ Bad:**\n\`\`\`\n${extractedRule.examples.bad}\n\`\`\`\n` : ''}
---
**Source:** Video transcript - ${videoTitle}
**Asset ID:** \`${assetId}\`
**Generated:** ${new Date().toISOString()}
`,
          isPublic: false,
          isActive: true,
          source: "mux-transcript",
          muxAssetId: assetId,
          videoTranscriptId: transcriptResult.insertedId.toString(),
          userId: metadata.userId,
          projectId: metadata.projectId,
          aiConfidence: aiResult.confidence,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const ruleResult = await rulesCollection.insertOne(rule);
        extractedRuleIds.push(ruleResult.insertedId.toString());
        console.log(`[Mux] ✅ Created rule: ${extractedRule.title}`);
      }

      // Step 5: Update VideoTranscript with rule IDs
      await transcriptsCollection.updateOne(
        { _id: transcriptResult.insertedId },
        { $set: { extractedRules: extractedRuleIds } }
      );
    }

    console.log(`[Mux] 🎉 Successfully processed video ${assetId}: ${aiResult.rules.length} rules extracted`);
    console.log(`[Mux] Summary: ${aiResult.summary}`);

  } catch (error) {
    console.error("[Mux] Failed to process transcript:", error);
    
    // Create error placeholder rule so we don't lose the event
    try {
      const rulesCollection = await getCollection("rules");
      await rulesCollection.insertOne({
        name: `⚠️ Processing Failed: ${assetId?.slice(0, 8)}`,
        description: `Failed to process video transcript. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        category: "general",
        tags: ["error", "failed-processing", "mux"],
        content: `## Processing Error\n\nAsset: ${assetId}\nTrack: ${trackId}\n\nPlease check logs and retry.`,
        isPublic: false,
        isActive: false,
        source: "mux-transcript",
        muxAssetId: assetId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch {
      // Silently fail - we already logged the original error
    }
    
    throw error;
  }
}

/**
 * Verify Mux webhook signature (recommended for production)
 * @see https://docs.mux.com/guides/video/verify-webhook-signatures
 */
// async function verifyMuxSignature(request: Request, body: string): Promise<boolean> {
//   const signature = request.headers.get("mux-signature");
//   if (!signature || !process.env.MUX_WEBHOOK_SECRET) return false;
//   
//   // Implementation would use crypto.timingSafeEqual
//   return true;
// }
