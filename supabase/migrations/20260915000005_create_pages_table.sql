-- Migration: create pages table for Notion-like document feature
--
-- Adds a pages table that supports:
-- - Hierarchical document structure (parent/child nesting)
-- - Rich content stored as JSON block array (editor-agnostic)
-- - Workspace scoping
-- - Icon/cover customization
-- - Reorderable via sort_order

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB DEFAULT '[]'::jsonb,
  icon TEXT DEFAULT '📄',
  icon_color TEXT DEFAULT '#6366f1',
  cover_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching pages by workspace
CREATE INDEX IF NOT EXISTS idx_pages_workspace_id ON pages(workspace_id);

-- Index for fetching child pages
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);

-- Index for ordering within a parent
CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(workspace_id, parent_id, sort_order);

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user in the same workspace can read pages
CREATE POLICY "Workspace members can read pages"
  ON pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.workspace_id = pages.workspace_id
    )
  );

-- Insert: workspace members can create pages
CREATE POLICY "Workspace members can create pages"
  ON pages FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.workspace_id = pages.workspace_id
    )
  );

-- Update: workspace members can update pages they created, or founders can update any
CREATE POLICY "Workspace members can update pages"
  ON pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.workspace_id = pages.workspace_id
        AND (wm.role = 'founder' OR pages.created_by = auth.uid())
    )
  );

-- Delete: workspace members can delete pages they created, or founders can delete any
CREATE POLICY "Workspace members can delete pages"
  ON pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.workspace_id = pages.workspace_id
        AND (wm.role = 'founder' OR pages.created_by = auth.uid())
    )
  );
