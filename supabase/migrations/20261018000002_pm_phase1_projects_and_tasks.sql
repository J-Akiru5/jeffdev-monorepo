-- Migration: Phase 1 — real workspace-scoped project lists (pm_projects) + task linkage
--
-- Part of the prism-manage "team-usable core" phase:
--   - pm_projects replaces the fake client-side "list-N" ids the app used to
--     group tasks by. Workspace-scoped, member-visible, founder-deletable.
--   - tasks gains pm_project_id (the real list FK) + due_time (schema drift:
--     the app has written due_time since launch but no migration ever added it).
--   - Backfill: one "General" list per workspace that has tasks; existing
--     workspace tasks are re-pointed at it.
--
-- Additive only: no existing columns, constraints, or RLS policies on `tasks`
-- are removed or altered, so other consumers (prism-admin reads tasks /
-- calendar_events / notifications) are unaffected.
-- Idempotent: safe to re-run.

-- =============================================================================
-- 1. pm_projects
-- =============================================================================

CREATE TABLE IF NOT EXISTS pm_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_projects_workspace_status ON pm_projects(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_pm_projects_sort ON pm_projects(workspace_id, sort_order);

-- updated_at trigger (same pattern as pm_tasks)
CREATE OR REPLACE FUNCTION update_pm_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pm_projects_updated_at ON pm_projects;

CREATE TRIGGER pm_projects_updated_at
  BEFORE UPDATE ON pm_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_pm_projects_updated_at();

-- RLS: workspace members can view / create / update; founders can delete.
ALTER TABLE pm_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view workspace pm_projects" ON pm_projects;
CREATE POLICY "Members can view workspace pm_projects" ON pm_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = pm_projects.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create workspace pm_projects" ON pm_projects;
CREATE POLICY "Members can create workspace pm_projects" ON pm_projects
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = pm_projects.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can update workspace pm_projects" ON pm_projects;
CREATE POLICY "Members can update workspace pm_projects" ON pm_projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = pm_projects.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Founders can delete workspace pm_projects" ON pm_projects;
CREATE POLICY "Founders can delete workspace pm_projects" ON pm_projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = pm_projects.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'founder'
    )
  );

-- =============================================================================
-- 2. tasks: real list linkage + drift fix
-- =============================================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS pm_project_id UUID REFERENCES pm_projects(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS due_time TIME;

CREATE INDEX IF NOT EXISTS idx_tasks_pm_project_id ON tasks(pm_project_id);

-- =============================================================================
-- 3. Backfill: default "General" list per workspace + re-point existing tasks
-- =============================================================================

INSERT INTO pm_projects (workspace_id, name, color, sort_order)
SELECT DISTINCT t.workspace_id, 'General', 'var(--color-cyan)', 0
FROM tasks t
WHERE t.workspace_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM pm_projects p
    WHERE p.workspace_id = t.workspace_id
    AND p.name = 'General'
  );

UPDATE tasks t
SET pm_project_id = p.id
FROM pm_projects p
WHERE p.workspace_id = t.workspace_id
  AND p.name = 'General'
  AND t.pm_project_id IS NULL;
