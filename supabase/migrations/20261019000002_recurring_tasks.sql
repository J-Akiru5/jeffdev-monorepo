-- Migration: recurring tasks (new plan)
-- -------------------------------------
-- A task can carry a recurrence; completing an occurrence spawns the next
-- one (same shape, due date advanced). recurrence_source_id links spawned
-- occurrences back to their origin for traceability.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurrence TEXT
    CHECK (recurrence IN ('daily', 'weekly', 'monthly'));

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurrence_source_id UUID
    REFERENCES tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_source
  ON tasks(recurrence_source_id)
  WHERE recurrence_source_id IS NOT NULL;
