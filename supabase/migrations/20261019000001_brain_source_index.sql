-- Migration: Company Brain (R1) — source lookup index
-- ---------------------------------------------------
-- Distillation upserts one memory entry per source (e.g. a task thread);
-- this index keeps those lookups cheap as the brain grows.

CREATE INDEX IF NOT EXISTS idx_memory_entries_source
  ON memory_entries(source_type, source_id);
