-- Migration: fix CPO review triggers after tasks.tags column was dropped
--
-- Phase 1B (20260601100001) replaced tasks.tags TEXT[] with the
-- tags / task_tags junction tables, but the auto_tag_cpo_review() BEFORE
-- UPDATE trigger kept referencing NEW.tags. As a result, every status
-- transition into 'in_review' failed at runtime with:
--
--   column "tags" of relation "tasks" does not exist
--
-- This migration preserves the current (junction-table) data model:
--   1. The BEFORE UPDATE trigger keeps only the CPO auto-assignment.
--   2. The "CPO Review" tagging moves into the AFTER UPDATE trigger and
--      writes through the tags / task_tags junction tables.
--   3. The CPO notification behavior is unchanged.
--
-- Moving a task into 'in_review' no longer causes a database failure.

-- ---------------------------------------------------------------------------
-- 1. Drop the broken triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tasks_auto_tag_cpo_review ON tasks;
DROP TRIGGER IF EXISTS tasks_notify_cpo_review ON tasks;

-- ---------------------------------------------------------------------------
-- 2. BEFORE UPDATE: auto-assign the task to the CPO (no tags array access)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_tag_cpo_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cpo_user_id UUID;
  syntaxure_ws_id UUID;
BEGIN
  -- Only act when status changes TO in_review
  IF NEW.status = 'in_review' AND (OLD.status IS DISTINCT FROM 'in_review') THEN

    -- Find Syntaxure Labs workspace
    SELECT id INTO syntaxure_ws_id FROM workspaces WHERE name = 'Syntaxure Labs' LIMIT 1;

    IF syntaxure_ws_id IS NOT NULL THEN
      -- Find the CPO (user assigned to the Product department in Syntaxure Labs)
      SELECT wm.user_id INTO cpo_user_id
      FROM workspace_members wm
      JOIN departments d ON d.id = wm.department_id
      WHERE d.name = 'Product'
        AND d.workspace_id = syntaxure_ws_id
      LIMIT 1;

      -- Auto-assign task to CPO
      IF cpo_user_id IS NOT NULL THEN
        NEW.assigned_to := cpo_user_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_auto_tag_cpo_review
  BEFORE UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_tag_cpo_review();

-- ---------------------------------------------------------------------------
-- 3. AFTER UPDATE: notify the CPO and add the "CPO Review" tag via the
--    tags / task_tags junction tables
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_cpo_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cpo_user_id UUID;
  syntaxure_ws_id UUID;
BEGIN
  -- Only act when status changes TO in_review
  IF NEW.status = 'in_review' AND (OLD.status IS DISTINCT FROM 'in_review') THEN
    -- Find Syntaxure Labs workspace
    SELECT id INTO syntaxure_ws_id FROM workspaces WHERE name = 'Syntaxure Labs' LIMIT 1;

    IF syntaxure_ws_id IS NOT NULL THEN
      -- Find the CPO
      SELECT wm.user_id INTO cpo_user_id
      FROM workspace_members wm
      JOIN departments d ON d.id = wm.department_id
      WHERE d.name = 'Product'
        AND d.workspace_id = syntaxure_ws_id
      LIMIT 1;

      -- Create a notification for the CPO
      IF cpo_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, related_id, action_url)
        VALUES (
          cpo_user_id,
          'Task awaiting your review',
          'A task "' || COALESCE(NEW.title, 'untitled') || '" has been moved to In Review and needs CPO approval.',
          'info',
          NEW.id,
          '/kanban'
        );
      END IF;
    END IF;

    -- Add "CPO Review" tag if not already present (junction-table model)
    INSERT INTO tags (name)
    VALUES ('CPO Review')
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO task_tags (task_id, tag_id)
    SELECT NEW.id, t.id FROM tags t WHERE t.name = 'CPO Review'
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_notify_cpo_review
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_cpo_review();
