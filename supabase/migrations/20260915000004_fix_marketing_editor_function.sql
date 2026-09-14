-- Migration: fix is_marketing_editor function to check workspace_members.c_level_title
-- (not user_profiles.c_level_title which doesn't exist)

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

  -- CEO or CMO (c_level_title is on workspace_members)
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
