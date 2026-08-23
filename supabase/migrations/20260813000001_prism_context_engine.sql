-- Migration: Prism Context Engine — Cosmos DB (MongoDB API + Gremlin) → Postgres
--
-- Moves Prism off the suspended Azure Cosmos DB account onto this project's
-- existing Supabase Postgres instance. See PRISM_MIGRATION.md at the repo root
-- for the full rationale and a file-by-file list of what changed.
--
-- Source: 14 Cosmos collections (projects, rules, skills, components, brands,
-- ruleSets, apiKeys, subscriptions, usage, generations, videos,
-- prism_telemetry, governance_memory, users) + the Gremlin rules graph.
-- `webhook_events` already existed in Postgres (20250731000001) and is reused
-- as-is — the PayPal webhook idempotency logic just points at it now instead
-- of the Cosmos `webhook_events` collection.
--
-- No data is migrated by this file: the source Cosmos account is unreachable
-- (the whole reason for this migration), so every new table starts empty.

-- =============================================================================
-- 0. EXTENSIONS
-- =============================================================================
-- pgvector for video-transcript embeddings (was brute-force cosine similarity
-- computed in Node over every row — this is a strict upgrade, not a downgrade).
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- =============================================================================
-- 1. user_profiles: Prism-specific columns
-- =============================================================================
-- `tier` already existed on user_profiles (used across apps). `status` and
-- `notification_prefs` are new — folded in from the Cosmos `users` collection
-- rather than creating a parallel prism_users table, since user_profiles.id
-- already IS the Supabase auth user id used everywhere else in Prism.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB;

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_status_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_status_check CHECK (status IN ('active', 'suspended'));

-- =============================================================================
-- 2. prism_projects
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  design_system TEXT NOT NULL,
  stack         TEXT NOT NULL CHECK (stack IN ('react', 'nextjs', 'react-native')),
  visibility    TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_prism_projects_user_id ON prism_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_prism_projects_created_at ON prism_projects(created_at DESC);

ALTER TABLE prism_projects ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. prism_rules
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID REFERENCES prism_projects(id) ON DELETE SET NULL,
  -- No FK to user_profiles: at least one existing code path (MCP list_rules)
  -- wrote a literal "demo-user" sentinel here under Cosmos. Preserved as-is.
  created_by        UUID NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  category          TEXT NOT NULL DEFAULT 'custom'
                       CHECK (category IN ('architecture', 'styling', 'security', 'performance', 'testing', 'documentation', 'custom')),
  content           TEXT NOT NULL,
  priority          INTEGER NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
  tags              TEXT[] NOT NULL DEFAULT '{}',
  pattern           TEXT,
  severity          TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('error', 'warning', 'info')),
  source            TEXT NOT NULL DEFAULT 'manual',
  skills_content    TEXT,
  source_rule_set   UUID,
  original_rule_id  UUID,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prism_rules_project_id ON prism_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_prism_rules_created_by ON prism_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_prism_rules_category ON prism_rules(category);
CREATE INDEX IF NOT EXISTS idx_prism_rules_is_active ON prism_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_prism_rules_created_at ON prism_rules(created_at DESC);
-- GIN index for tag containment/overlap queries (replaces the Gremlin "tag" vertex).
CREATE INDEX IF NOT EXISTS idx_prism_rules_tags ON prism_rules USING GIN (tags);

ALTER TABLE prism_rules ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. prism_skills
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES prism_projects(id) ON DELETE SET NULL,
  created_by  UUID NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL,
  steps       JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  source      TEXT NOT NULL DEFAULT 'manual',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prism_skills_project_id ON prism_skills(project_id);
CREATE INDEX IF NOT EXISTS idx_prism_skills_created_by ON prism_skills(created_by);
CREATE INDEX IF NOT EXISTS idx_prism_skills_category ON prism_skills(category);

ALTER TABLE prism_skills ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. prism_components
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_components (
  id            TEXT PRIMARY KEY, -- app-generated `comp_<hex>`, preserved format
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  code          TEXT NOT NULL,
  rules         TEXT,
  design_system TEXT NOT NULL,
  stack         TEXT NOT NULL,
  generated_by  TEXT NOT NULL DEFAULT 'ai',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prism_components_user_id ON prism_components(user_id);
CREATE INDEX IF NOT EXISTS idx_prism_components_created_at ON prism_components(created_at DESC);

ALTER TABLE prism_components ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. prism_brands
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_brands (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  slug         TEXT NOT NULL,
  company_name TEXT NOT NULL,
  tagline      TEXT,
  industry     TEXT NOT NULL,
  colors       JSONB NOT NULL,
  typography   JSONB NOT NULL,
  voice        JSONB NOT NULL,
  imagery      JSONB NOT NULL,
  spacing      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_prism_brands_user_id ON prism_brands(user_id);

ALTER TABLE prism_brands ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. prism_rule_sets (public marketplace bundles)
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_rule_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  rule_ids    UUID[] NOT NULL DEFAULT '{}',
  is_public   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prism_rule_sets_is_public ON prism_rule_sets(is_public);
CREATE INDEX IF NOT EXISTS idx_prism_rule_sets_created_at ON prism_rule_sets(created_at DESC);

ALTER TABLE prism_rule_sets ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 8. prism_api_keys
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_api_keys (
  id            TEXT PRIMARY KEY, -- app-generated `key_<hex>`, preserved format
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  key_hash      TEXT NOT NULL UNIQUE,
  key_prefix    TEXT NOT NULL,
  name          TEXT NOT NULL,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prism_api_keys_user_id ON prism_api_keys(user_id);

ALTER TABLE prism_api_keys ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 9. prism_subscriptions (Prism SaaS billing — distinct from the agency
--    `subscriptions` table, which is PayPal/Maya client contract billing)
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  tier                    TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team', 'enterprise')),
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  paypal_subscription_id  TEXT,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  modified_by             UUID,
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prism_subscriptions_status ON prism_subscriptions(status);

ALTER TABLE prism_subscriptions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 10. prism_usage
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_usage (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  month               TEXT NOT NULL, -- YYYY-MM
  ai_generations      INTEGER NOT NULL DEFAULT 0,
  rules_created       INTEGER NOT NULL DEFAULT 0,
  components_created  INTEGER NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);

ALTER TABLE prism_usage ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 11. prism_generations
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_generations (
  id         TEXT PRIMARY KEY, -- app-generated `gen_<hex>`, preserved format
  user_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'component',
  prompt     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prism_generations_user_created ON prism_generations(user_id, created_at DESC);

ALTER TABLE prism_generations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 12. prism_videos (+ pgvector embedding column)
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_videos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES prism_projects(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  duration   INTEGER,
  transcript TEXT,
  embedding  extensions.vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prism_videos_project_id ON prism_videos(project_id);
-- Approximate nearest-neighbor index for semantic search. Replaces the
-- in-Node brute-force cosine-similarity loop in vector-search.ts.
CREATE INDEX IF NOT EXISTS idx_prism_videos_embedding ON prism_videos
  USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 100);

ALTER TABLE prism_videos ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 13. prism_telemetry
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_telemetry (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  tool_name       TEXT NOT NULL,
  token_count     INTEGER NOT NULL DEFAULT 0,
  byte_size       INTEGER NOT NULL DEFAULT 0,
  is_error        BOOLEAN NOT NULL DEFAULT false,
  cache_hit       BOOLEAN NOT NULL DEFAULT false,
  from_cache      BOOLEAN NOT NULL DEFAULT false,
  client_platform TEXT,
  -- Not a FK / not UUID on purpose: telemetry is best-effort logging and
  -- callers may send an arbitrary id string; strict typing here would turn
  -- a logging call into a hard failure.
  project_id      TEXT,
  model           TEXT,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prism_telemetry_user_timestamp ON prism_telemetry(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_prism_telemetry_tool_name ON prism_telemetry(tool_name);
CREATE INDEX IF NOT EXISTS idx_prism_telemetry_project_id ON prism_telemetry(project_id);

ALTER TABLE prism_telemetry ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 14. prism_governance_memory
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_governance_memory (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT NOT NULL CHECK (type IN ('decision', 'pattern', 'violation', 'consensus', 'incident', 'progress', 'context')),
  scope      TEXT NOT NULL CHECK (scope IN ('project', 'team', 'global')),
  -- Not UUID on purpose — see prism_telemetry.project_id above.
  project_id TEXT,
  team_id    TEXT,
  content    TEXT NOT NULL,
  tags       TEXT[] NOT NULL DEFAULT '{}',
  importance TEXT NOT NULL DEFAULT 'medium' CHECK (importance IN ('critical', 'high', 'medium', 'low')),
  source     TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata   JSONB
);

CREATE INDEX IF NOT EXISTS idx_prism_governance_memory_project_id ON prism_governance_memory(project_id);
CREATE INDEX IF NOT EXISTS idx_prism_governance_memory_team_id ON prism_governance_memory(team_id);
CREATE INDEX IF NOT EXISTS idx_prism_governance_memory_type ON prism_governance_memory(type);
CREATE INDEX IF NOT EXISTS idx_prism_governance_memory_expires_at ON prism_governance_memory(expires_at);

ALTER TABLE prism_governance_memory ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 15. prism_rule_edges (replaces the Cosmos Gremlin `relates_to` /
--     `conflicts_with` edges — tag overlap is now a GIN-indexed array query
--     against prism_rules.tags instead of a graph traversal)
-- =============================================================================
CREATE TABLE IF NOT EXISTS prism_rule_edges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_rule_id UUID NOT NULL REFERENCES prism_rules(id) ON DELETE CASCADE,
  to_rule_id   UUID NOT NULL REFERENCES prism_rules(id) ON DELETE CASCADE,
  edge_type    TEXT NOT NULL CHECK (edge_type IN ('relates_to', 'conflicts_with')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_rule_id, to_rule_id, edge_type)
);

CREATE INDEX IF NOT EXISTS idx_prism_rule_edges_from ON prism_rule_edges(from_rule_id);
CREATE INDEX IF NOT EXISTS idx_prism_rule_edges_to ON prism_rule_edges(to_rule_id);

ALTER TABLE prism_rule_edges ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 16. RLS: default-deny for anon/authenticated, service role manages everything
-- =============================================================================
-- Prism's API routes and MCP server talk to Postgres through Prisma using a
-- service-role/direct connection and already do their own auth.userId scoping
-- in application code (same trust model the Cosmos client had). These policies
-- are the defensive backstop that keeps the tables unreachable via
-- Supabase's PostgREST/Realtime APIs under the anon or authenticated key.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'prism_projects', 'prism_rules', 'prism_skills', 'prism_components',
    'prism_brands', 'prism_rule_sets', 'prism_api_keys', 'prism_subscriptions',
    'prism_usage', 'prism_generations', 'prism_videos', 'prism_telemetry',
    'prism_governance_memory', 'prism_rule_edges'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Service role can manage %I" ON %I;', t, t
    );
    EXECUTE format(
      'CREATE POLICY "Service role can manage %I" ON %I FOR ALL USING (auth.role() = ''service_role'');',
      t, t
    );
  END LOOP;
END $$;
