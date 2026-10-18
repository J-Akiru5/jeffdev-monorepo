-- Migration: Drop pm_tasks (syntaxure-pm retired)
--
-- apps/syntaxure-pm was deprecated and discontinued on 2026-10-18 and
-- removed from the monorepo; prism-manage is the canonical internal ops
-- tool. pm_tasks has no remaining readers, so the table and its helper
-- function are dropped outright.
--
-- Historical context:
--   - Table created in 20260606000001_create_pm_tasks.sql
--   - Retirement rationale: docs/architecture-audit-2026-08-20.md

DROP TABLE IF EXISTS pm_tasks;
DROP FUNCTION IF EXISTS update_pm_tasks_updated_at();
