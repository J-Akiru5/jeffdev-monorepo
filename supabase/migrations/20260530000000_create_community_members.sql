-- Community members table (for newsletter/registration on community portal)
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  github_username TEXT,
  discord_handle TEXT,
  primary_role TEXT,
  interests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index (idempotent)
CREATE INDEX IF NOT EXISTS idx_community_members_email ON community_members(email);

-- RLS
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Allow insert (registration) publicly
DROP POLICY IF EXISTS "Anyone can register for the community" ON community_members;
CREATE POLICY "Anyone can register for the community" ON community_members
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view or admin/founder to manage
DROP POLICY IF EXISTS "Admins can view and manage community members" ON community_members;
CREATE POLICY "Admins can view and manage community members" ON community_members
  FOR ALL TO authenticated USING (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_community_members_updated_at ON community_members;
CREATE TRIGGER update_community_members_updated_at BEFORE UPDATE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
