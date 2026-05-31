-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'discussion',
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES community_members(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);

-- RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage community posts" ON community_posts;
CREATE POLICY "Authenticated users can manage community posts" ON community_posts
  FOR ALL TO authenticated USING (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Community invite tokens table
CREATE TABLE IF NOT EXISTS community_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_invites_token ON community_invites(token);
CREATE INDEX IF NOT EXISTS idx_community_invites_email ON community_invites(email);

ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage community invites" ON community_invites;
CREATE POLICY "Authenticated users can manage community invites" ON community_invites
  FOR ALL TO authenticated USING (true);
