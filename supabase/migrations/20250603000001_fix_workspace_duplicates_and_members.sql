-- Migration: Fix workspace duplicates and populate workspace_members for existing users
--
-- Problems found on remote database:
-- 1. Duplicate workspaces (2x Personal, 2x Syntaxure Labs) — no UNIQUE constraint on name
-- 2. workspace_members is empty — existing users never got auto-added
-- 3. The auto-join migration only iterated over existing workspace_members, which was empty
--
-- Fixes:
-- 1. Deduplicate workspaces by name, keeping the oldest
-- 2. Add UNIQUE constraint on workspaces(name)
-- 3. Deduplicate departments the same way
-- 4. Add all existing user_profiles to both Personal and Syntaxure Labs workspaces

-- =============================================================================
-- 1. Deduplicate workspaces — keep the oldest for each name
-- =============================================================================
DO $$
DECLARE
  dup RECORD;
  keep_id UUID;
BEGIN
  -- Process each duplicate workspace name
  FOR dup IN
    SELECT name, MIN(created_at) AS first_created
    FROM workspaces
    GROUP BY name
    HAVING COUNT(*) > 1
  LOOP
    -- Get the ID of the oldest workspace with this name
    SELECT id INTO keep_id
    FROM workspaces
    WHERE name = dup.name
    ORDER BY created_at ASC
    LIMIT 1;

    -- Delete newer duplicates (ON DELETE CASCADE will clean up related records)
    DELETE FROM workspaces
    WHERE name = dup.name
      AND id != keep_id;
  END LOOP;
END $$;

-- =============================================================================
-- 2. Deduplicate departments — keep the oldest for each (workspace_id, name)
-- =============================================================================
DO $$
DECLARE
  dup RECORD;
  keep_id UUID;
BEGIN
  FOR dup IN
    SELECT workspace_id, name, MIN(created_at) AS first_created
    FROM departments
    GROUP BY workspace_id, name
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keep_id
    FROM departments
    WHERE workspace_id = dup.workspace_id
      AND name = dup.name
    ORDER BY created_at ASC
    LIMIT 1;

    -- Delete department duplicates
    DELETE FROM departments
    WHERE workspace_id = dup.workspace_id
      AND name = dup.name
      AND id != keep_id;
  END LOOP;
END $$;

-- =============================================================================
-- 3. Add UNIQUE constraint on workspaces(name) to prevent future duplicates
-- =============================================================================
-- First clean up any remaining duplicates (shouldn't exist after step 1)
DELETE FROM workspaces a USING workspaces b
WHERE a.id > b.id AND a.name = b.name;

ALTER TABLE workspaces
  DROP CONSTRAINT IF EXISTS workspaces_name_unique;

ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_name_unique UNIQUE (name);

-- =============================================================================
-- 4. Add all existing users to both Personal and Syntaxure Labs workspaces
-- =============================================================================
DO $$
DECLARE
  personal_ws_id UUID;
  syntaxure_ws_id UUID;
  user_rec RECORD;
BEGIN
  -- Find workspace IDs
  SELECT id INTO personal_ws_id FROM workspaces WHERE name = 'Personal' LIMIT 1;
  SELECT id INTO syntaxure_ws_id FROM workspaces WHERE name = 'Syntaxure Labs' OR name = 'Syntaxure Labs, Inc.' LIMIT 1;

  -- Add all existing users to Personal workspace as founders
  IF personal_ws_id IS NOT NULL THEN
    FOR user_rec IN SELECT id FROM user_profiles LOOP
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (personal_ws_id, user_rec.id, 'founder')
      ON CONFLICT (workspace_id, user_id) DO NOTHING;
    END LOOP;
  END IF;

  -- Add all existing users to Syntaxure Labs as founders
  IF syntaxure_ws_id IS NOT NULL THEN
    FOR user_rec IN SELECT id FROM user_profiles LOOP
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (syntaxure_ws_id, user_rec.id, 'founder')
      ON CONFLICT (workspace_id, user_id) DO NOTHING;
    END LOOP;
  END IF;

  RAISE NOTICE 'Added all existing users to Personal and Syntaxure Labs workspaces.';
END $$;
