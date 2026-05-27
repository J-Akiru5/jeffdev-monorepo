-- Migration: Workspaces, Departments, RBAC & Task Enhancement
--
-- Phase 1 of the multi-tenant RBAC upgrade for prism-manage.
-- Implements the "simpler Notion" architecture with Workspaces,
-- Departments, strict Founder/Employee RBAC, and enhanced task schema.
--
-- =============================================================================
-- 1. WORKSPACES
-- =============================================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Seed the default workspaces
INSERT INTO workspaces (name) VALUES
  ('Personal'),
  ('Syntaxure Labs')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 2. WORKSPACE MEMBERS (RBAC Gatekeeper)
-- =============================================================================
-- Composite PK ensures one role per user per workspace.
CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('founder', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Index for looking up a user's workspaces
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);

-- =============================================================================
-- 3. DEPARTMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Seed Syntaxure Labs departments
DO $$
DECLARE
  syntaxure_id UUID;
BEGIN
  SELECT id INTO syntaxure_id FROM workspaces WHERE name = 'Syntaxure Labs' LIMIT 1;

  IF syntaxure_id IS NOT NULL THEN
    INSERT INTO departments (workspace_id, name) VALUES
      (syntaxure_id, 'Executive'),
      (syntaxure_id, 'Engineering'),
      (syntaxure_id, 'Operations'),
      (syntaxure_id, 'Marketing'),
      (syntaxure_id, 'Product')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_departments_workspace_id ON departments(workspace_id);

-- =============================================================================
-- 4. TASKS TABLE ENHANCEMENT
-- =============================================================================
-- Add workspace and department foreign keys
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Update task_type CHECK to include 'uncategorized'
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_task_type_check;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type IN ('feature', 'nice-to-have', 'bug', 'error', 'uncategorized'));

-- Update default for task_type to 'uncategorized'
ALTER TABLE tasks
  ALTER COLUMN task_type SET DEFAULT 'uncategorized';

-- Update status CHECK to the new workflow enum
-- Old: 'todo', 'in_progress', 'review', 'done'
-- New: 'backlog', 'todo', 'in_progress', 'in_review', 'approved'
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Migration: map old status values to new ones
UPDATE tasks SET status = 'backlog' WHERE status = 'todo' AND (created_at = updated_at OR status IS NULL);
UPDATE tasks SET status = 'in_review' WHERE status = 'review';
-- 'in_progress' stays the same
UPDATE tasks SET status = 'approved' WHERE status = 'done';

ALTER TABLE tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'approved'));

-- Add a path_index for ordering tasks within a column/department
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS path_index INTEGER DEFAULT 0;

-- Indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_department_id ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_path_index ON tasks(path_index);

-- =============================================================================
-- 5. RLS POLICIES for workspaces
-- =============================================================================
-- Members can view workspaces they belong to
DROP POLICY IF EXISTS "Members can view their workspaces" ON workspaces;
CREATE POLICY "Members can view their workspaces" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 6. RLS POLICIES for workspace_members
-- =============================================================================
-- Users can view their own memberships
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;
CREATE POLICY "Users can view their own memberships" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());

-- Founders can manage members in their workspace
DROP POLICY IF EXISTS "Founders can manage workspace members" ON workspace_members;
CREATE POLICY "Founders can manage workspace members" ON workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'founder'
    )
  );

-- Allow inserts during registration/onboarding
DROP POLICY IF EXISTS "Allow member insert during onboarding" ON workspace_members;
CREATE POLICY "Allow member insert during onboarding" ON workspace_members
  FOR INSERT WITH CHECK (
    -- First workspace member creation (no existing members)
    NOT EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspace_members.workspace_id
    )
    OR
    -- Or the user is inserting their own membership
    user_id = auth.uid()
  );

-- =============================================================================
-- 7. RLS POLICIES for departments
-- =============================================================================
-- Members can view departments in their workspaces
DROP POLICY IF EXISTS "Members can view departments" ON departments;
CREATE POLICY "Members can view departments" ON departments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = departments.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 8. UPDATED RLS POLICIES for tasks
-- =============================================================================
-- Drop old policies and recreate with workspace-aware scoping
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Members can view workspace tasks" ON tasks;
DROP POLICY IF EXISTS "Members can insert workspace tasks" ON tasks;
DROP POLICY IF EXISTS "Members can update workspace tasks" ON tasks;
DROP POLICY IF EXISTS "Members can delete workspace tasks" ON tasks;

-- Members can view tasks in workspaces they belong to
CREATE POLICY "Members can view workspace tasks" ON tasks
  FOR SELECT USING (
    workspace_id IS NULL
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
    OR
    auth.uid() = tasks.user_id
    OR
    public.is_admin()
  );

-- Members can create tasks in their workspaces
CREATE POLICY "Members can insert workspace tasks" ON tasks
  FOR INSERT WITH CHECK (
    workspace_id IS NULL
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
    OR
    auth.uid() = tasks.user_id
    OR
    public.is_admin()
  );

-- Members can update tasks in their workspaces
CREATE POLICY "Members can update workspace tasks" ON tasks
  FOR UPDATE USING (
    workspace_id IS NULL
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
    OR
    auth.uid() = tasks.user_id
    OR
    public.is_admin()
  );

CREATE POLICY "Members can delete workspace tasks" ON tasks
  FOR DELETE USING (
    workspace_id IS NULL
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
    OR
    auth.uid() = tasks.user_id
    OR
    public.is_admin()
  );

-- =============================================================================
-- 9. HELPER FUNCTIONS
-- =============================================================================

-- Check if a user is a founder in a given workspace
CREATE OR REPLACE FUNCTION public.is_founder(workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = is_founder.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role = 'founder'
  );
END;
$$;

-- Get the user's default workspace (their personal workspace)
CREATE OR REPLACE FUNCTION public.get_default_workspace()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  personal_id UUID;
BEGIN
  SELECT id INTO personal_id FROM workspaces WHERE name = 'Personal' LIMIT 1;
  RETURN personal_id;
END;
$$;

-- =============================================================================
-- 10. TRIGGER: Auto-join Personal workspace on user registration
-- =============================================================================
CREATE OR REPLACE FUNCTION public.auto_join_personal_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  personal_ws_id UUID;
BEGIN
  SELECT id INTO personal_ws_id FROM workspaces WHERE name = 'Personal' LIMIT 1;

  IF personal_ws_id IS NOT NULL THEN
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (personal_ws_id, NEW.id, 'founder')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_join_personal_workspace_trigger ON user_profiles;
CREATE TRIGGER auto_join_personal_workspace_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_join_personal_workspace();
