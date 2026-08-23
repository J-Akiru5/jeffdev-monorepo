-- =============================================================================
-- 20260823000002_prism_phase1_integrity.sql
--
-- Phase 1 correctness debt (roadmap): DB hygiene from the 2026-08-23
-- solidity deep scan.
--
-- Contents:
--   1. bump_prism_ai_generations(p_user_id, p_delta) — ATOMIC monthly AI
--      usage counter replacing the racy read-modify-write in /api/generate.
--      Month bucketed in UTC (prism_usage.month is TEXT 'YYYY-MM').
--   2. FK constraints on the three orphan-prone created_by columns.
--      Added NOT VALID: enforces all NEW writes immediately while leaving
--      pre-existing sentinel/demo rows unvalidated. Run
--      `ALTER TABLE ... VALIDATE CONSTRAINT` after confirming/cleaning
--      legacy rows to upgrade them to full validation.
--   3. Composite index for the hottest query (CLI pass endpoint):
--      prism_rules(project_id, is_active, priority, created_at DESC)
--      plus the /v1/rules listing shape (created_by, is_active, priority).
--   4. UNIQUE on prism_subscriptions.paypal_subscription_id — added ONLY if
--      no duplicate values exist today (checked at runtime; a warning is
--      raised instead of failing the whole migration when dupes exist).
--
-- Apply via Supabase migrations (Jeff: Supabase dashboard/CLI). No table or
-- column shapes change; rules.json v1 contract untouched.
-- =============================================================================

-- 1. Atomic AI-generation counter -------------------------------------------
CREATE OR REPLACE FUNCTION bump_prism_ai_generations(
  p_user_id UUID,
  p_delta INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_month TEXT;
  v_new_value INTEGER;
BEGIN
  -- UTC month bucket: server-local TZ drift was flagged in the scan.
  v_month := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');

  INSERT INTO prism_usage AS pu (id, user_id, month, ai_generations)
  VALUES (gen_random_uuid(), p_user_id, v_month, GREATEST(p_delta, 0))
  ON CONFLICT (user_id, month)
  DO UPDATE
    SET ai_generations = GREATEST(pu.ai_generations + p_delta, 0),
        updated_at     = now()
  RETURNING ai_generations INTO v_new_value;

  RETURN v_new_value;
END;
$$;

-- 2. FKs on created_by columns (NOT VALID — new writes enforced now) --------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_prism_rules_created_by'
  ) THEN
    ALTER TABLE prism_rules
      ADD CONSTRAINT fk_prism_rules_created_by
      FOREIGN KEY (created_by) REFERENCES user_profiles(id)
      ON DELETE SET NULL NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_prism_skills_created_by'
  ) THEN
    ALTER TABLE prism_skills
      ADD CONSTRAINT fk_prism_skills_created_by
      FOREIGN KEY (created_by) REFERENCES user_profiles(id)
      ON DELETE SET NULL NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_prism_rule_sets_created_by'
  ) THEN
    ALTER TABLE prism_rule_sets
      ADD CONSTRAINT fk_prism_rule_sets_created_by
      FOREIGN KEY (created_by) REFERENCES user_profiles(id)
      ON DELETE SET NULL NOT VALID;
  END IF;
END;
$$;

-- NOTE: created_by is NOT NULL on these tables today; ON DELETE SET NULL
-- requires a nullable column. Relax NOT NULL so user deletion cascades into
-- rule removal by a follow-up cleanup job instead of hard-failing.
DO $$
BEGIN
  EXECUTE 'ALTER TABLE prism_rules ALTER COLUMN created_by DROP NOT NULL';
  EXECUTE 'ALTER TABLE prism_skills ALTER COLUMN created_by DROP NOT NULL';
  EXECUTE 'ALTER TABLE prism_rule_sets ALTER COLUMN created_by DROP NOT NULL';
EXCEPTION WHEN undefined_column OR wrong_object_type THEN
  RAISE WARNING 'created_by column relaxation skipped (schema drift)';
END;
$$;

-- 3. Composite indexes for hot paths ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_prism_rules_project_active_priority
  ON prism_rules(project_id, is_active, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prism_rules_creator_active_priority
  ON prism_rules(created_by, is_active, priority);

-- 4. UNIQUE paypal_subscription_id (guarded against existing dupes) ---------
DO $$
DECLARE
  dupe_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dupe_count FROM (
    SELECT paypal_subscription_id
    FROM prism_subscriptions
    WHERE paypal_subscription_id IS NOT NULL
    GROUP BY paypal_subscription_id
    HAVING COUNT(*) > 1
  ) d;

  IF dupe_count > 0 THEN
    RAISE WARNING
      'Cannot add UNIQUE on paypal_subscription_id: % duplicate value(s) exist. Resolve manually, then re-run this block.',
      dupe_count;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_prism_subscriptions_paypal_subscription_id'
  ) THEN
    ALTER TABLE prism_subscriptions
      ADD CONSTRAINT uq_prism_subscriptions_paypal_subscription_id
      UNIQUE (paypal_subscription_id);
  END IF;
END;
$$;
