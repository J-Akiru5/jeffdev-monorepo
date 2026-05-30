-- Migration: Fix calendar_events schema mismatch
-- Adds missing columns that prism-manage expects but don't exist in the DB

-- Add all_day column (for all-day events)
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false;

-- Add Google Calendar integration columns
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Add task linkage column
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_calendar_id ON calendar_events(google_calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_linked_task_id ON calendar_events(linked_task_id);
