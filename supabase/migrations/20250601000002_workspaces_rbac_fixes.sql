-- Migration: Workspaces RBAC Fixes
--
-- Fixes two bugs in the 20250601000001 migration:
-- 1. Adds department_id to workspace_members so employees can be assigned to a department
-- 2. Fixes the self-referencing RLS insert policy that compared a column to itself

-- =============================================================================
-- 1. Add department_id to workspace_members
-- =============================================================================
ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_members_department_id
  ON workspace_members(department_id);

-- =============================================================================
-- 2. Fix the self-referencing RLS insert policy
--    The old policy had: workspace_members.workspace_id = workspace_members.workspace_id
--    which is always true, making the first condition check if the ENTIRE table is empty.
--    Fixed to properly check for existing members in the target workspace.
-- =============================================================================
DROP POLICY IF EXISTS "Allow member insert during onboarding" ON workspace_members;

CREATE POLICY "Allow member insert during onboarding" ON workspace_members
  FOR INSERT WITH CHECK (
    -- First workspace member creation for this specific workspace
    NOT EXISTS (
      SELECT 1 FROM workspace_members AS wm_check
      WHERE wm_check.workspace_id = workspace_members.workspace_id
    )
    OR
    -- Or the user is inserting their own membership
    user_id = auth.uid()
  );
