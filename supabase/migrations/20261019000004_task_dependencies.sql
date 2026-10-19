-- Migration: task dependencies (arc 3 · D4)
-- ------------------------------------------
-- blocker → blocked edges. Approval is gated while a task has open blockers.

CREATE TABLE IF NOT EXISTS task_dependencies (
  blocker_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_blocked
  ON task_dependencies(blocked_id);

-- RLS: visible/editable to members of the tasks' workspace.
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view task dependencies" ON task_dependencies;
CREATE POLICY "Members can view task dependencies" ON task_dependencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_dependencies.blocked_id
        AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can add task dependencies" ON task_dependencies;
CREATE POLICY "Members can add task dependencies" ON task_dependencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_dependencies.blocked_id
        AND wm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Members can remove task dependencies" ON task_dependencies;
CREATE POLICY "Members can remove task dependencies" ON task_dependencies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_dependencies.blocked_id
        AND wm.user_id = auth.uid()
    )
  );
