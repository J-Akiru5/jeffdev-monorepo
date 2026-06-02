-- Migration: Add 'archived' status to feedback table
-- Enables soft-delete/archiving for historical analytics

ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_status_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_status_check
  CHECK (status IN ('received', 'acknowledged', 'resolved', 'archived'));
