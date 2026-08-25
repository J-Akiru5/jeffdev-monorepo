-- =============================================================================
-- 20260825000000_prism_phase6_data_integrity.sql
--
-- Phase 6 data integrity debt (roadmap): finish the FK story left open by
-- the 2026-08-23 phase 1 migration.
--
-- Contents:
--   1. prism_rules.project_id / prism_skills.project_id FKs upgraded from
--      ON DELETE SET NULL to ON DELETE CASCADE. Deleting a project now
--      removes its rules/skills at the database level no matter which
--      client issues the delete; the app-level cleanup in
--      DELETE /api/v1/projects/[id] stays as defense in depth. Existing
--      rows are unaffected until their parent project goes away.
--   2. FKs on prism_rules.source_rule_set -> prism_rule_sets(id) and
--      prism_rules.original_rule_id -> prism_rules(id), both ON DELETE
--      SET NULL and NOT VALID: new writes are enforced immediately while
--      pre-existing marketplace/copy rows are not re-validated (they may
--      contain legacy sentinel ids). Run VALIDATE CONSTRAINT after a
--      cleanup pass to upgrade.
--   3. Partial UNIQUE index on prism_rules(created_by, original_rule_id)
--      WHERE original_rule_id IS NOT NULL — DB backstop for the
--      marketplace install check-then-insert dedupe race (solidity scan
--      §3). Added only if no duplicate values exist today; a warning is
--      raised instead of failing the migration when dupes exist.
--
-- Apply via Supabase migrations (Jeff: Supabase dashboard/CLI). No column
-- shapes change; rules.json v1 contract untouched.
-- =============================================================================

-- 1. project_id FKs: SET NULL -> CASCADE -------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prism_rules_project_id_fkey'
  ) THEN
    ALTER TABLE prism_rules DROP CONSTRAINT prism_rules_project_id_fkey;
  END IF;
  ALTER TABLE prism_rules
    ADD CONSTRAINT prism_rules_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES prism_projects(id)
    ON DELETE CASCADE NOT VALID;
END;
$$;

ALTER TABLE prism_rules
  VALIDATE CONSTRAINT prism_rules_project_id_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prism_skills_project_id_fkey'
  ) THEN
    ALTER TABLE prism_skills DROP CONSTRAINT prism_skills_project_id_fkey;
  END IF;
  ALTER TABLE prism_skills
    ADD CONSTRAINT prism_skills_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES prism_projects(id)
    ON DELETE CASCADE NOT VALID;
END;
$$;

ALTER TABLE prism_skills
  VALIDATE CONSTRAINT prism_skills_project_id_fkey;

-- 2. Marketplace copy provenance FKs (NOT VALID — legacy rows may be garbage) -
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_prism_rules_source_rule_set'
  ) THEN
    ALTER TABLE prism_rules
      ADD CONSTRAINT fk_prism_rules_source_rule_set
      FOREIGN KEY (source_rule_set) REFERENCES prism_rule_sets(id)
      ON DELETE SET NULL NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_prism_rules_original_rule_id'
  ) THEN
    ALTER TABLE prism_rules
      ADD CONSTRAINT fk_prism_rules_original_rule_id
      FOREIGN KEY (original_rule_id) REFERENCES prism_rules(id)
      ON DELETE SET NULL NOT VALID;
  END IF;
END;
$$;

-- 3. Marketplace install dedupe backstop --------------------------------------
DO $$
DECLARE
  dupe_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dupe_count FROM (
    SELECT created_by, original_rule_id
    FROM prism_rules
    WHERE original_rule_id IS NOT NULL
    GROUP BY created_by, original_rule_id
    HAVING COUNT(*) > 1
  ) d;

  IF dupe_count > 0 THEN
    RAISE WARNING
      'Cannot add unique index on (created_by, original_rule_id): % duplicate value(s) exist. Resolve manually, then re-run this block.',
      dupe_count;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'uq_prism_rules_owner_original_rule'
  ) THEN
    CREATE UNIQUE INDEX uq_prism_rules_owner_original_rule
      ON prism_rules(created_by, original_rule_id)
      WHERE original_rule_id IS NOT NULL;
  END IF;
END;
$$;
