-- Phase 1D: Normalize site_pages → Structured Tables
-- Problem: site_pages.content is a monolithic JSONB blob.
--   Individual fields cannot be queried, indexed, or validated at DB level.
-- Solution: Create page_sections table with one row per section,
--   keep site_pages as a lightweight registry.

-- =============================================================================
-- STEP 1: Create page_sections table
-- =============================================================================
CREATE TABLE IF NOT EXISTS page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  section_key TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'content',
  content JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_slug, section_key)
);

-- =============================================================================
-- STEP 2: Migrate existing site_pages JSONB content into page_sections rows
-- =============================================================================
DO $$
DECLARE
  page_record RECORD;
  key TEXT;
  sort_idx INT;
BEGIN
  FOR page_record IN SELECT id, slug, content FROM site_pages WHERE content IS NOT NULL AND content != '{}'::jsonb LOOP
    sort_idx := 0;
    FOR key IN SELECT jsonb_object_keys(page_record.content) LOOP
      sort_idx := sort_idx + 1;
      INSERT INTO page_sections (page_slug, section_key, section_type, content, sort_order)
      VALUES (
        page_record.slug,
        key,
        CASE
          WHEN jsonb_typeof(page_record.content->key) = 'array' THEN 'list'
          WHEN jsonb_typeof(page_record.content->key) = 'object' THEN 'content'
          ELSE 'text'
        END,
        page_record.content->key,
        sort_idx
      )
      ON CONFLICT (page_slug, section_key) DO UPDATE
      SET content = EXCLUDED.content,
          sort_order = EXCLUDED.sort_order,
          section_type = EXCLUDED.section_type;
    END LOOP;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 3: Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_page_sections_slug ON page_sections(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_sections_slug_order ON page_sections(page_slug, sort_order);

-- =============================================================================
-- STEP 4: RLS
-- =============================================================================
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view page_sections" ON page_sections FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage page_sections" ON page_sections FOR ALL USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- STEP 5: Trigger for updated_at
-- =============================================================================
CREATE TRIGGER update_page_sections_updated_at BEFORE UPDATE ON page_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 6: Drop content column from site_pages (registry-only)
-- =============================================================================
ALTER TABLE site_pages DROP COLUMN IF EXISTS content;
