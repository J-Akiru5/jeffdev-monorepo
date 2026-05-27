-- Migration: Add task_type and is_starred to tasks table
--
-- 1. Adds task_type column with CHECK constraint for the 4 type categories
-- 2. Adds is_starred boolean column (replaces the abused priority hack)
-- 3. Migrates existing star data: priority='high' → is_starred=true
-- 4. Resets priority to 'medium' baseline for proper priority usage

-- =============================================================================
-- 1. Add task_type column
-- =============================================================================
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'feature'
  CHECK (task_type IN ('feature', 'nice-to-have', 'bug', 'error'));

-- =============================================================================
-- 2. Add is_starred column
-- =============================================================================
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT false;

-- =============================================================================
-- 3. Data migration: migrate existing star state from priority column
--    The old frontend treated priority='high' as "starred"
-- =============================================================================
UPDATE tasks
SET is_starred = true
WHERE priority = 'high';

-- =============================================================================
-- 4. Reset priority to 'medium' baseline for the new proper priority system
-- =============================================================================
UPDATE tasks
SET priority = 'medium'
WHERE priority IS NULL OR priority NOT IN ('low', 'medium', 'high');

-- =============================================================================
-- 5. Create index on task_type for faster filtering
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- =============================================================================
-- 6. Create index on is_starred for starred filter queries
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_is_starred ON tasks(is_starred) WHERE is_starred = true;
