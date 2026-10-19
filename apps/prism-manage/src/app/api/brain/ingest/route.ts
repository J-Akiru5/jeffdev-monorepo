import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/log";
import { embedText } from "@/lib/embeddings";

/**
 * POST /api/brain/ingest
 * ----------------------
 * Scoped ingestion for agent sessions (opencode first). Auth is a shared
 * secret header (`x-brain-secret` → BRAIN_INGEST_SECRET); fail-closed when
 * the secret is unset. No user session required — the caller is an agent.
 *
 * Body: { workspaceId, title, summary, sourceId?, decisions? }
 */

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.BRAIN_INGEST_SECRET;
  const provided = request.headers.get("x-brain-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const workspaceId = String(body.workspaceId || "");
  const title = String(body.title || "")
    .trim()
    .slice(0, 200);
  const summary = String(body.summary || "")
    .trim()
    .slice(0, 8000);
  const sourceId = body.sourceId ? String(body.sourceId).slice(0, 200) : null;
  const decisions = Array.isArray(body.decisions) ? body.decisions : [];

  if (!workspaceId || !title || !summary) {
    return NextResponse.json(
      { error: "workspaceId, title and summary are required" },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 503 },
    );
  }

  try {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: workspace } = await admin
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .maybeSingle();
    if (!workspace) {
      return NextResponse.json({ error: "Unknown workspace" }, { status: 400 });
    }

    const embedding = await embedText(`${title}\n${summary}`);

    const { data, error } = await admin
      .from("memory_entries")
      .insert({
        workspace_id: workspaceId,
        source_type: "agent-session",
        source_id: sourceId,
        title,
        summary,
        decisions,
        // pgvector surfaces as `string` in generated types (type-only cast).
        ...(embedding ? { embedding: embedding as unknown as string } : {}),
      })
      .select("id")
      .single();

    if (error || !data) {
      logger.error("brain.ingest.failed", { error: error?.message });
      return NextResponse.json(
        { error: error?.message || "Insert failed" },
        { status: 500 },
      );
    }

    logger.info("brain.ingested", {
      entryId: data.id,
      workspaceId,
      sourceId,
      hasEmbedding: Boolean(embedding),
    });
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    logger.error("brain.ingest.fatal", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}
