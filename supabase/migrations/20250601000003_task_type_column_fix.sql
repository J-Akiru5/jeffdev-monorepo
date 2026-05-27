-- Migration: Fix missing task_type/is_starred columns
--
-- The 20250601000001 migration assumes task_type already exists from
-- 20250530000001, but if that migration wasn't applied (e.g. running
-- individual SQL), the operations referencing task_type fail with
-- ERROR 42703: column "task_type" does not exist.
--
-- This migration defensively adds both columns if missing, then
-- re-applies the CHECK constraint and default changes.

-- =============================================================================
-- 1. Add task_type column if it doesn't exist
-- =============================================================================
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'feature'
  CHECK (task_type IN ('feature', 'nice-to-have', 'bug', 'error'));

-- =============================================================================
-- 2. Add is_starred column if it doesn't exist
-- =============================================================================
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT false;

-- =============================================================================
-- 3. Update task_type CHECK to include 'uncategorized'
--    Use a DO block to handle the case where the column already exists
--    (and thus already has the old constraint) vs. was just added above.
-- =============================================================================
DO $$
BEGIN
  -- Drop the old constraint if it exists (from the previous ADD COLUMN or from migration 20250530000001)
  ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_task_type_check;

  -- Add the updated constraint with 'uncategorized'
  ALTER TABLE tasks
    ADD CONSTRAINT tasks_task_type_check
    CHECK (task_type IN ('feature', 'nice-to-have', 'bug', 'error', 'uncategorized'));

  -- Set the default
  ALTER TABLE tasks
    ALTER COLUMN task_type SET DEFAULT 'uncategorized';
EXCEPTION
  WHEN undefined_column THEN
    -- Column still doesn't exist — nothing we can do
    RAISE WARNING 'task_type column does not exist on tasks table, skipping constraint update';
END $$;

-- =============================================================================
-- 4. Index for task_type (if not already created)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- =============================================================================
-- 5. Index for is_starred (if not already created)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_is_starred ON tasks(is_starred) WHERE is_starred = true;
