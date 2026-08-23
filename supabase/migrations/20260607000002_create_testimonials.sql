-- Migration: Create testimonials table
-- Stores client testimonials for the syntaxure-labs public site

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  quote TEXT NOT NULL,
  avatar_url TEXT,
  featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for featured testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials (featured, sort_order);

-- RLS policies
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read testimonials" ON testimonials;
DROP POLICY IF EXISTS "Service role can manage testimonials" ON testimonials;

-- Public can read all testimonials
CREATE POLICY "Public can read testimonials"
  ON testimonials FOR SELECT
  USING (true);

-- Service role can manage all testimonials
CREATE POLICY "Service role can manage testimonials"
  ON testimonials FOR ALL
  TO service_role
  USING (true);
