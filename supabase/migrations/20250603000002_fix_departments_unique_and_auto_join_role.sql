-- Migration: Add departments unique constraint + fix auto-join role
--
-- Changes:
-- 1. Add UNIQUE (workspace_id, name) on departments to prevent future duplicates
-- 2. Update auto_join_workspaces trigger to use 'employee' for Syntaxure Labs
--    (existing users remain as 'founder' — only new signups get employee)

-- =============================================================================
-- 1. Add UNIQUE constraint on departments(workspace_id, name)
-- =============================================================================
ALTER TABLE departments
  DROP CONSTRAINT IF EXISTS departments_ws_name_unique;

ALTER TABLE departments
  ADD CONSTRAINT departments_ws_name_unique UNIQUE (workspace_id, name);

-- =============================================================================
-- 2. Update the auto-join trigger: new users get 'employee' for Syntaxure Labs
-- =============================================================================
CREATE OR REPLACE FUNCTION public.auto_join_workspaces()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  personal_ws_id UUID;
  syntaxure_ws_id UUID;
BEGIN
  -- Find Personal workspace
  SELECT id INTO personal_ws_id FROM workspaces WHERE name = 'Personal' LIMIT 1;
  IF personal_ws_id IS NOT NULL THEN
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (personal_ws_id, NEW.id, 'founder')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Find Syntaxure Labs workspace
  SELECT id INTO syntaxure_ws_id FROM workspaces WHERE name = 'Syntaxure Labs' OR name = 'Syntaxure Labs, Inc.' LIMIT 1;
  IF syntaxure_ws_id IS NOT NULL THEN
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (syntaxure_ws_id, NEW.id, 'employee')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
