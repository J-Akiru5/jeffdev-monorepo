-- Migration: drift fixes surfaced by the typed clients (H4)
-- ---------------------------------------------------------
-- Three live-schema/application mismatches found while wiring the generated
-- types into the clients:
--
-- 1. milestones.created_by — createMilestone() records the creator, but the
--    column never existed (PostgREST rejected the insert → the create path
--    failed at runtime).
-- 2. milestones.project_id was NOT NULL, but the app has no project concept
--    for milestones (it never sends one) — the insert could never succeed.
-- 3. milestones.due_date was NOT NULL while the app allows undated milestones.
-- 4. bmc_sections.content was TEXT while the app stores structured objects
--    (JSON) — writes were rejected; the column becomes JSONB.

ALTER TABLE milestones
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE milestones
  ALTER COLUMN project_id DROP NOT NULL;

ALTER TABLE milestones
  ALTER COLUMN due_date DROP NOT NULL;

-- content was TEXT with a text default — swap default around the cast.
ALTER TABLE bmc_sections ALTER COLUMN content DROP DEFAULT;
ALTER TABLE bmc_sections
  ALTER COLUMN content TYPE JSONB USING content::jsonb;
ALTER TABLE bmc_sections ALTER COLUMN content SET DEFAULT '{}'::jsonb;
