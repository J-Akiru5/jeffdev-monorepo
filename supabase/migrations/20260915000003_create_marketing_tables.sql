-- Migration: create marketing tables with RLS aligned to application authorization
--
-- The marketing_schema.sql file was never applied as a migration. This creates
-- the four marketing tables and enables RLS with policies that match the
-- application's authorization model:
--
--   READ:  any authenticated user (marketing data is internal but visible)
--   WRITE: founders, CEO/CMO (c_level_title), or Marketing department employees
--
-- This replaces the old admin/manager role check which never matched the
-- actual user_profiles data (no users have role = 'admin' or 'manager').

-- =============================================================================
-- 1. TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS marketing_phases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timeframe TEXT,
  description TEXT,
  color TEXT,
  "order" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS marketing_kpis (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  current_value NUMERIC DEFAULT 0,
  target_value NUMERIC NOT NULL,
  unit TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS marketing_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  phase_id TEXT REFERENCES marketing_phases(id),
  owner_ids TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  platform TEXT,
  description TEXT,
  github_issue_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_team (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  initials TEXT,
  color TEXT,
  focus TEXT
);

-- =============================================================================
-- 2. ENABLE RLS
-- =============================================================================

ALTER TABLE marketing_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_team ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. RLS POLICIES — READ (public for authenticated users)
-- =============================================================================

CREATE POLICY "Authenticated users can read marketing_phases"
  ON marketing_phases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read marketing_kpis"
  ON marketing_kpis FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read marketing_team"
  ON marketing_team FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read marketing_tasks"
  ON marketing_tasks FOR SELECT
  USING (auth.role() = 'authenticated');

-- =============================================================================
-- 4. RLS POLICIES — WRITE (founders, CEO/CMO, or Marketing dept employees)
--
-- Helper function: is_marketing_editor(uid)
--   Returns true if the user is:
--   - A founder in any workspace, OR
--   - Has c_level_title IN ('ceo', 'cmo') in user_profiles, OR
--   - Is a member of the Marketing department in any workspace
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_marketing_editor(uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Founder in any workspace
  IF EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = uid AND wm.role = 'founder'
  ) THEN
    RETURN TRUE;
  END IF;

  -- CEO or CMO (c_level_title is on workspace_members, not user_profiles)
  IF EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = uid AND wm.c_level_title IN ('ceo', 'cmo')
  ) THEN
    RETURN TRUE;
  END IF;

  -- Marketing department employee
  IF EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN departments d ON d.id = wm.department_id
    WHERE wm.user_id = uid AND d.name = 'Marketing'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Marketing phases: founders/CEO/CMO can manage
CREATE POLICY "Authorized users can insert marketing_phases"
  ON marketing_phases FOR INSERT
  WITH CHECK (public.is_marketing_editor(auth.uid()));

CREATE POLICY "Authorized users can update marketing_phases"
  ON marketing_phases FOR UPDATE
  USING (public.is_marketing_editor(auth.uid()));

CREATE POLICY "Authorized users can delete marketing_phases"
  ON marketing_phases FOR DELETE
  USING (public.is_marketing_editor(auth.uid()));

-- Marketing KPIs: founders/CEO/CMO can manage
CREATE POLICY "Authorized users can insert marketing_kpis"
  ON marketing_kpis FOR INSERT
  WITH CHECK (public.is_marketing_editor(auth.uid()));

CREATE POLICY "Authorized users can update marketing_kpis"
  ON marketing_kpis FOR UPDATE
  USING (public.is_marketing_editor(auth.uid()));

CREATE POLICY "Authorized users can delete marketing_kpis"
  ON marketing_kpis FOR DELETE
  USING (public.is_marketing_editor(auth.uid()));

-- Marketing tasks: founders/CEO/CMO/Marketing dept can manage
CREATE POLICY "Authorized users can insert marketing_tasks"
  ON marketing_tasks FOR INSERT
  WITH CHECK (public.is_marketing_editor(auth.uid()));

CREATE POLICY "Authorized users can update marketing_tasks"
  ON marketing_tasks FOR UPDATE
  USING (public.is_marketing_editor(auth.uid()));

CREATE POLICY "Authorized users can delete marketing_tasks"
  ON marketing_tasks FOR DELETE
  USING (public.is_marketing_editor(auth.uid()));

-- Marketing team: founders/CEO/CMO can manage
CREATE POLICY "Authorized users can insert marketing_team"
  ON marketing_team FOR INSERT
  WITH CHECK (public.is_marketing_editor(auth.uid()));

CREATE POLICY "Authorized users can update marketing_team"
  ON marketing_team FOR UPDATE
  USING (public.is_marketing_editor(auth.uid()));

CREATE POLICY "Authorized users can delete marketing_team"
  ON marketing_team FOR DELETE
  USING (public.is_marketing_editor(auth.uid()));
