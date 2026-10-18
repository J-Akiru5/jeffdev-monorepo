-- Migration: harden workspace_members RLS against self-promotion
--
-- The previous "Allow member insert during onboarding" policy allowed any
-- authenticated user to insert themselves into any existing workspace with
-- an arbitrary role (including 'founder'). Combined with the
-- "Founders can manage workspace members" policy this was a
-- privilege-escalation path.
--
-- New rules:
--   - A user may only self-insert as 'founder' when the workspace is still
--     empty (first-member bootstrap).
--   - Into an existing workspace a user may only self-insert as 'employee'.
--   - Founders keep full member management (insert/update/delete of any
--     member in their workspace) through the existing
--     "Founders can manage workspace members" policy.
--   - The auto-join triggers on user_profiles are unaffected because they
--     run as SECURITY DEFINER and bypass RLS.

DROP POLICY IF EXISTS "Allow member insert during onboarding" ON workspace_members;

CREATE POLICY "Allow member insert during onboarding" ON workspace_members
  FOR INSERT WITH CHECK (
    (
      NOT EXISTS (
        SELECT 1
        FROM workspace_members AS wm_check
        WHERE wm_check.workspace_id = workspace_members.workspace_id
      )
      AND user_id = auth.uid()
      AND role = 'founder'
    )
    OR
    (
      user_id = auth.uid()
      AND role = 'employee'
    )
  );
