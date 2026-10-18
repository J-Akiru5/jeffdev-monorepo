-- Migration: Phase 2 — collaboration (comments, watchers, notification plumbing, realtime)
--
-- Part of the prism-manage "collaboration layer":
--   - task_comments: threaded task discussions (workspace-member visible)
--   - task_watchers: who gets notified about a task
--   - notifications upgrades: actor/entity columns, unread index, extended type
--     CHECK (the original CHECK only allowed info/success/warning/error)
--   - realtime: add tasks / task_comments / notifications to the supabase_realtime
--     publication so boards, comments, and the bell update live
--
-- Additive only. Idempotent: safe to re-run.

-- =============================================================================
-- 1. task_comments
-- =============================================================================

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id, created_at);

CREATE OR REPLACE FUNCTION update_task_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_comments_updated_at ON task_comments;

CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_comments_updated_at();

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Workspace members can read comments on tasks in their workspaces
DROP POLICY IF EXISTS "Members can view task comments" ON task_comments;
CREATE POLICY "Members can view task comments" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_comments.task_id
      AND wm.user_id = auth.uid()
    )
  );

-- Members can comment as themselves
DROP POLICY IF EXISTS "Members can create task comments" ON task_comments;
CREATE POLICY "Members can create task comments" ON task_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_comments.task_id
      AND wm.user_id = auth.uid()
    )
  );

-- Authors can edit / delete their own comments
DROP POLICY IF EXISTS "Authors can update task comments" ON task_comments;
CREATE POLICY "Authors can update task comments" ON task_comments
  FOR UPDATE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete task comments" ON task_comments;
CREATE POLICY "Authors can delete task comments" ON task_comments
  FOR DELETE USING (author_id = auth.uid());

-- =============================================================================
-- 2. task_watchers
-- =============================================================================

CREATE TABLE IF NOT EXISTS task_watchers (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

ALTER TABLE task_watchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view task watchers" ON task_watchers;
CREATE POLICY "Members can view task watchers" ON task_watchers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_watchers.task_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can watch tasks" ON task_watchers;
CREATE POLICY "Members can watch tasks" ON task_watchers
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_watchers.task_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can unwatch tasks" ON task_watchers;
CREATE POLICY "Users can unwatch tasks" ON task_watchers
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- 3. notifications upgrades
-- =============================================================================

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS entity_type TEXT;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read, created_at DESC);

-- Extend the type CHECK (original: info/success/warning/error only)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('info', 'success', 'warning', 'error', 'task', 'comment', 'mention', 'assignment', 'approval'));

-- =============================================================================
-- 4. Realtime publication (guarded — tables may already be added)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'task_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
