-- Migration: Add contact and scope columns to quotes, rename messages to contact_messages
-- Safe for production: uses IF EXISTS/IF NOT EXISTS guards

-- 1. Add new columns to quotes table
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "template_selected" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "customization_scope" TEXT;

-- 2. Backfill: copy title → name for existing rows where name is null
UPDATE "quotes" SET "name" = "title" WHERE "name" IS NULL AND "title" IS NOT NULL;

-- 3. Add index on template_selected
CREATE INDEX IF NOT EXISTS "quotes_template_selected_idx" ON "quotes"("template_selected");

-- 4. Rename messages table to contact_messages
ALTER TABLE "messages" RENAME TO "contact_messages";

-- 5. Add type column to contact_messages
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'general';

-- 6. Update Prisma migration tracking
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES (
  gen_random_uuid(),
  'manual',
  NOW(),
  '20260603000000_add_quote_contact_fields',
  NULL,
  NULL,
  NOW(),
  1
) ON CONFLICT DO NOTHING;
