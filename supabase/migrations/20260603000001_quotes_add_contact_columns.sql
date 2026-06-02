-- Migration: Add contact and scope columns to quotes table
-- Aligned with SaaS template customization quote flow

-- Add contact columns
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add template/scope columns
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS template_selected TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customization_scope TEXT;

-- Update status CHECK constraint to include admin workflow statuses
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('new', 'reviewed', 'responded', 'accepted', 'declined', 'draft', 'sent', 'rejected', 'expired'));

-- Backfill: copy title → name for existing rows where name is null
UPDATE quotes SET name = title WHERE name IS NULL AND title IS NOT NULL;

-- Add index on template_selected for filtering
CREATE INDEX IF NOT EXISTS idx_quotes_template_selected ON quotes USING btree (template_selected);
