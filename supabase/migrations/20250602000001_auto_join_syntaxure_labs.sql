-- ============================================
-- Auto-Join Existing Users to Syntaxure Labs
-- ============================================
-- This migration:
-- 1. Creates a function to auto-add users to Syntaxure Labs workspace
-- 2. Updates the auto_join_personal_workspace trigger to also add to Syntaxure Labs
-- 3. Adds ALL existing users who aren't already members to Syntaxure Labs as founders
-- 4. Assigns each user to their Personal workspace's founder membership

-- Step 1: Find the Syntaxure Labs workspace ID
DO $$
DECLARE
  syntaxure_ws_id UUID;
  personal_ws_id UUID;
  user_rec RECORD;
  existing_count INT;
BEGIN
  -- Get workspace IDs
  SELECT id INTO syntaxure_ws_id FROM workspaces WHERE name = 'Syntaxure Labs' OR name = 'Syntaxure Labs, Inc.' LIMIT 1;
  SELECT id INTO personal_ws_id FROM workspaces WHERE name = 'Personal' LIMIT 1;

  -- Skip if Syntaxure Labs doesn't exist
  IF syntaxure_ws_id IS NULL THEN
    RAISE NOTICE 'Syntaxure Labs workspace not found, skipping auto-join.';
    RETURN;
  END IF;

  -- Step 2: For each existing user (from workspace_members), add to Syntaxure Labs if not already a member
  FOR user_rec IN SELECT DISTINCT user_id FROM workspace_members LOOP
    SELECT COUNT(*) INTO existing_count FROM workspace_members
      WHERE workspace_id = syntaxure_ws_id AND user_id = user_rec.user_id;

    IF existing_count = 0 THEN
      INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
      VALUES (syntaxure_ws_id, user_rec.user_id, 'founder', NOW());
    END IF;
  END LOOP;

  RAISE NOTICE 'Auto-joined all existing workspace members to Syntaxure Labs as founders.';
END $$;

-- Step 3: Update the auto_join_personal_workspace trigger to also auto-join Syntaxure Labs
-- We'll replace the existing trigger function with an enhanced version
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
    VALUES (syntaxure_ws_id, NEW.id, 'founder')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger, replace with new one
DROP TRIGGER IF EXISTS auto_join_personal_workspace ON user_profiles;
CREATE TRIGGER auto_join_workspaces
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_workspaces();
