-- Migration: Phase 3 — saved views + task query index
--
-- Part of the prism-manage "search, views & speed" phase:
--   - saved_views: per-user filter presets (optionally shared with the workspace)
--   - a workspace+created index for the task list's default ordering
--
-- Additive only. Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id, workspace_id);

CREATE OR REPLACE FUNCTION update_saved_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS saved_views_updated_at ON saved_views;

CREATE TRIGGER saved_views_updated_at
  BEFORE UPDATE ON saved_views
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_views_updated_at();

ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

-- Own views, plus shared views from workspace teammates
DROP POLICY IF EXISTS "Users can view own and shared views" ON saved_views;
CREATE POLICY "Users can view own and shared views" ON saved_views
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      is_shared = true
      AND EXISTS (
        SELECT 1 FROM workspace_members wm
        WHERE wm.workspace_id = saved_views.workspace_id
        AND wm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create own views" ON saved_views;
CREATE POLICY "Users can create own views" ON saved_views
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = saved_views.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own views" ON saved_views;
CREATE POLICY "Users can update own views" ON saved_views
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own views" ON saved_views;
CREATE POLICY "Users can delete own views" ON saved_views
  FOR DELETE USING (user_id = auth.uid());

-- Query index for the task list's workspace + recency ordering
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_created ON tasks(workspace_id, created_at DESC);
