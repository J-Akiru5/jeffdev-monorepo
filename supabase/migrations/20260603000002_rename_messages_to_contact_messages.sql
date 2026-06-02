-- Migration: Rename messages table to contact_messages
-- Prevents future naming conflicts with system/internal messages

ALTER TABLE messages RENAME TO contact_messages;

-- Update status CHECK constraint to include 'unread' and 'archived'
ALTER TABLE contact_messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_status_check
  CHECK (status IN ('received', 'read', 'responded', 'unread', 'archived'));

-- Add type column if not exists (for categorizing contact messages)
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

-- Update RLS policies (rename references)
-- The existing RLS policies should auto-update with the rename, but let's ensure
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
