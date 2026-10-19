-- Migration: task templates (arc 3 · D1)
-- ---------------------------------------
-- Workspace-scoped templates that prefill task creation (name + the task
-- shape: title, type, priority, description, tags, default list).

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'uncategorized',
  priority TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  pm_project_id UUID REFERENCES pm_projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_templates_workspace
  ON task_templates(workspace_id, name);

-- updated_at trigger (same pattern as the rest of the schema)
CREATE OR REPLACE FUNCTION update_task_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_templates_updated_at ON task_templates;

CREATE TRIGGER task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_task_templates_updated_at();

-- RLS: members view + create; creators and founders update/delete.
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view workspace templates" ON task_templates;
CREATE POLICY "Members can view workspace templates" ON task_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = task_templates.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create workspace templates" ON task_templates;
CREATE POLICY "Members can create workspace templates" ON task_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = task_templates.workspace_id
        AND wm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Creators and founders can update templates" ON task_templates;
CREATE POLICY "Creators and founders can update templates" ON task_templates
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = task_templates.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role = 'founder'
    )
  );

DROP POLICY IF EXISTS "Creators and founders can delete templates" ON task_templates;
CREATE POLICY "Creators and founders can delete templates" ON task_templates
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = task_templates.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role = 'founder'
    )
  );
