-- Migration: Create pm_tasks table for Syntaxure PM
-- Task management with checklists, deadlines, and categories

CREATE TABLE IF NOT EXISTS pm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'mcp-stability', 'documentation', 'architecture', 'testing', 'deployment')),
  deadline TIMESTAMPTZ,
  checklist JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pm_tasks_status ON pm_tasks(status);
CREATE INDEX idx_pm_tasks_priority ON pm_tasks(priority);
CREATE INDEX idx_pm_tasks_category ON pm_tasks(category);
CREATE INDEX idx_pm_tasks_deadline ON pm_tasks(deadline);
CREATE INDEX idx_pm_tasks_created_by ON pm_tasks(created_by);

-- RLS
ALTER TABLE pm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all pm_tasks" ON pm_tasks
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own pm_tasks" ON pm_tasks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own pm_tasks" ON pm_tasks
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own pm_tasks" ON pm_tasks
  FOR DELETE USING (auth.uid() = created_by);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_pm_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pm_tasks_updated_at
  BEFORE UPDATE ON pm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_pm_tasks_updated_at();
