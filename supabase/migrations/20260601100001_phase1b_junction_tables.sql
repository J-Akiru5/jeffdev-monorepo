-- Phase 1B: Add Junction Tables
-- Problem: UUID[] and TEXT[] arrays store references without FK enforcement.
-- Solution: Create proper junction tables with FK constraints.

-- =============================================================================
-- TAGS TABLE (single source of truth for tag names)
-- =============================================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 1B.1: quote_services (quotes <-> customization_services)
-- Replaces: quotes.customization_service_ids UUID[]
-- =============================================================================
CREATE TABLE IF NOT EXISTS quote_services (
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES customization_services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (quote_id, service_id)
);

-- Migrate existing data
INSERT INTO quote_services (quote_id, service_id)
SELECT q.id, unnest(q.customization_service_ids)
FROM quotes q
WHERE q.customization_service_ids IS NOT NULL
  AND array_length(q.customization_service_ids, 1) > 0
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 1B.2: task_tags (tasks <-> tags)
-- Replaces: tasks.tags TEXT[]
-- =============================================================================
CREATE TABLE IF NOT EXISTS task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (task_id, tag_id)
);

-- Migrate existing tags from tasks
INSERT INTO tags (name)
SELECT DISTINCT unnest(tags)
FROM tasks
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
ON CONFLICT (name) DO NOTHING;

INSERT INTO task_tags (task_id, tag_id)
SELECT t.id, tg.id
FROM tasks t
CROSS JOIN unnest(t.tags) AS tag_name
JOIN tags tg ON tg.name = tag_name
WHERE t.tags IS NOT NULL AND array_length(t.tags, 1) > 0
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 1B.3: release_tags (releases <-> tags)
-- Replaces: releases.tags TEXT[]
-- =============================================================================
CREATE TABLE IF NOT EXISTS release_tags (
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (release_id, tag_id)
);

-- Migrate existing tags from releases
INSERT INTO tags (name)
SELECT DISTINCT unnest(tags)
FROM releases
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
ON CONFLICT (name) DO NOTHING;

INSERT INTO release_tags (release_id, tag_id)
SELECT r.id, tg.id
FROM releases r
CROSS JOIN unnest(r.tags) AS tag_name
JOIN tags tg ON tg.name = tag_name
WHERE r.tags IS NOT NULL AND array_length(r.tags, 1) > 0
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 1B.4: community_post_tags (community_posts <-> tags)
-- Replaces: community_posts.tags TEXT[]
-- =============================================================================
CREATE TABLE IF NOT EXISTS community_post_tags (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

-- Migrate existing tags from community_posts
INSERT INTO tags (name)
SELECT DISTINCT unnest(tags)
FROM community_posts
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
ON CONFLICT (name) DO NOTHING;

INSERT INTO community_post_tags (post_id, tag_id)
SELECT cp.id, tg.id
FROM community_posts cp
CROSS JOIN unnest(cp.tags) AS tag_name
JOIN tags tg ON tg.name = tag_name
WHERE cp.tags IS NOT NULL AND array_length(cp.tags, 1) > 0
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 1B.5: support_ticket_tags (support_tickets <-> tags)
-- Replaces: support_tickets.tags TEXT[]
-- =============================================================================
CREATE TABLE IF NOT EXISTS support_ticket_tags (
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (ticket_id, tag_id)
);

-- Migrate existing tags from support_tickets
INSERT INTO tags (name)
SELECT DISTINCT unnest(tags)
FROM support_tickets
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
ON CONFLICT (name) DO NOTHING;

INSERT INTO support_ticket_tags (ticket_id, tag_id)
SELECT st.id, tg.id
FROM support_tickets st
CROSS JOIN unnest(st.tags) AS tag_name
JOIN tags tg ON tg.name = tag_name
WHERE st.tags IS NOT NULL AND array_length(st.tags, 1) > 0
ON CONFLICT DO NOTHING;

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_quote_services_service_id ON quote_services(service_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_release_tags_tag_id ON release_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_community_post_tags_tag_id ON community_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_tags_tag_id ON support_ticket_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view tags" ON tags FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service role can manage tags" ON tags FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage quote_services" ON quote_services FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Anyone can read quote_services" ON quote_services FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage task_tags" ON task_tags FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage task_tags" ON task_tags FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage release_tags" ON release_tags FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Anyone can read release_tags" ON release_tags FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage community_post_tags" ON community_post_tags FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Anyone can read community_post_tags" ON community_post_tags FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage support_ticket_tags" ON support_ticket_tags FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- DROP OLD ARRAY COLUMNS
-- =============================================================================
ALTER TABLE quotes DROP COLUMN IF EXISTS customization_service_ids;
ALTER TABLE tasks DROP COLUMN IF EXISTS tags;
ALTER TABLE releases DROP COLUMN IF EXISTS tags;
ALTER TABLE community_posts DROP COLUMN IF EXISTS tags;
ALTER TABLE support_tickets DROP COLUMN IF EXISTS tags;
