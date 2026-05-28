-- Migration: Auto-tag CPO when a task moves to 'In Review' status
--
-- When a task's status changes to 'in_review':
-- 1. Auto-assign the task to the CPO (the user in the 'Product' department)
-- 2. Add a "CPO Review" tag to the task
-- 3. Create a notification for the CPO
--
-- The trigger only fires when status transitions TO 'in_review'.
-- Moving a task out of 'in_review' does NOT remove the CPO assignment or tag.

CREATE OR REPLACE FUNCTION public.auto_tag_cpo_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cpo_user_id UUID;
  syntaxure_ws_id UUID;
  task_title TEXT;
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

      -- 1. Auto-assign task to CPO
      IF cpo_user_id IS NOT NULL THEN
        NEW.assigned_to := cpo_user_id;
      END IF;
    END IF;

    -- 2. Add "CPO Review" tag if not already present
    IF NEW.tags IS NULL THEN
      NEW.tags := ARRAY['CPO Review'];
    ELSIF NOT (NEW.tags @> ARRAY['CPO Review']) THEN
      NEW.tags := array_append(NEW.tags, 'CPO Review');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_auto_tag_cpo_review ON tasks;
CREATE TRIGGER tasks_auto_tag_cpo_review
  BEFORE UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_tag_cpo_review();

-- =============================================================================
-- Also create notification for CPO after the update
-- (separate AFTER trigger so we can insert into the notifications table
--  after the task row is fully updated)
-- =============================================================================
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

      -- 3. Create a notification for the CPO
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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_notify_cpo_review ON tasks;
CREATE TRIGGER tasks_notify_cpo_review
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_cpo_review();
