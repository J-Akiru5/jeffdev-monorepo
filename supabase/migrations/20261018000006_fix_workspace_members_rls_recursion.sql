-- Migration: fix infinite recursion in workspace_members RLS
-- ----------------------------------------------------------
-- The "Founders can manage workspace members" policy (FOR ALL, so it applies
-- to SELECT as well) contained a subquery on workspace_members itself. Any
-- query that read a workspace_members row belonging to another user — or any
-- policy subquery that scanned the table by workspace_id (e.g. the
-- `workspaces!inner` embed in the prism-manage dashboard layout) — re-entered
-- the policy and Postgres aborted with:
--
--   "infinite recursion detected in policy for relation workspace_members"
--
-- Symptom in the app: every authenticated user saw zero workspaces
-- ("No Workspace Found" on the dashboard, empty workspace switcher).
--
-- Fix: evaluate membership checks through SECURITY DEFINER helper functions.
-- They run with the definer's privileges (table owner bypasses RLS), so the
-- inner lookup never re-enters the RLS policies. Canonical Supabase pattern.

CREATE OR REPLACE FUNCTION public.is_workspace_founder(ws_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND role = 'founder'
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_has_members(ws_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = ws_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_founder(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.workspace_has_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_founder(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_has_members(uuid) TO authenticated;

-- ── Recreate the recursive policies using the helpers ──────────────────────

DROP POLICY IF EXISTS "Founders can manage workspace members" ON workspace_members;
CREATE POLICY "Founders can manage workspace members" ON workspace_members
  FOR ALL USING (public.is_workspace_founder(workspace_id));

DROP POLICY IF EXISTS "Allow member insert during onboarding" ON workspace_members;
CREATE POLICY "Allow member insert during onboarding" ON workspace_members
  FOR INSERT WITH CHECK (
    (
      NOT public.workspace_has_members(workspace_id)
      AND user_id = auth.uid()
      AND role = 'founder'
    )
    OR
    (
      user_id = auth.uid()
      AND role = 'employee'
    )
  );
