-- Migration: Company Brain (R0 spike) — workspace-scoped, citable memory
-- ---------------------------------------------------------------------
-- "Ask why, get the receipts": a living memory of company decisions.
-- This is the R0 spike schema: explicit capture first, retrieval second.
-- Semantic search is best-effort (Gemini embeddings + pgvector); the
-- keyword fallback works without any embedding.
--
-- Idempotent: safe to re-run.

-- pgvector (Supabase keeps extensions in the `extensions` schema)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- =============================================================================
-- 1. memory_entries
-- =============================================================================

CREATE TABLE IF NOT EXISTS memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('decision', 'comment-thread', 'agent-session', 'milestone', 'bmc', 'manual')),
  source_id TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  embedding extensions.vector(768),
  review_status TEXT NOT NULL DEFAULT 'captured'
    CHECK (review_status IN ('captured', 'reviewed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_entries_workspace_created
  ON memory_entries(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memory_entries_embedding
  ON memory_entries USING hnsw (embedding extensions.vector_cosine_ops);

-- updated_at trigger (same pattern as the rest of the schema)
CREATE OR REPLACE FUNCTION update_memory_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS memory_entries_updated_at ON memory_entries;

CREATE TRIGGER memory_entries_updated_at
  BEFORE UPDATE ON memory_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_entries_updated_at();

-- =============================================================================
-- 2. RLS — workspace-scoped; founders curate
-- =============================================================================

ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view workspace memory" ON memory_entries;
CREATE POLICY "Members can view workspace memory" ON memory_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = memory_entries.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can capture memory" ON memory_entries;
CREATE POLICY "Members can capture memory" ON memory_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = memory_entries.workspace_id
        AND wm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Authors and founders can update memory" ON memory_entries;
CREATE POLICY "Authors and founders can update memory" ON memory_entries
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = memory_entries.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role = 'founder'
    )
  );

DROP POLICY IF EXISTS "Founders can delete memory" ON memory_entries;
CREATE POLICY "Founders can delete memory" ON memory_entries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = memory_entries.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role = 'founder'
    )
  );

-- =============================================================================
-- 3. Semantic search (RLS applies — SECURITY INVOKER)
-- =============================================================================

CREATE OR REPLACE FUNCTION match_memory_entries(
  query_embedding extensions.vector(768),
  match_workspace UUID,
  match_count INT DEFAULT 5,
  min_similarity FLOAT DEFAULT 0.2
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  source_type TEXT,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    m.id,
    m.title,
    m.summary,
    m.source_type,
    m.created_at,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM memory_entries m
  WHERE m.workspace_id = match_workspace
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) >= min_similarity
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;
