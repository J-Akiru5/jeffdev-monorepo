-- ============================================================================
-- JeffDev Monorepo — Initial Supabase Schema
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Core: user_profiles (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'manager', 'employee', 'client')),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role, tier)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    COALESCE(new.raw_user_meta_data->>'tier', 'free')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- Syntaxure Labs: Projects
-- ============================================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'archived')),
  category TEXT,
  technologies TEXT[],
  thumbnail_url TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Syntaxure Labs: Milestones
-- ============================================================================
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Syntaxure Labs: Quotes
-- ============================================================================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  service_type TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Syntaxure Labs: Invoices
-- ============================================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  quote_id UUID REFERENCES quotes(id),
  invoice_number TEXT UNIQUE NOT NULL,
  items JSONB DEFAULT '[]',
  total DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Syntaxure Labs: Calendar Events
-- ============================================================================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('meeting', 'deadline', 'milestone', 'personal', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  google_event_id TEXT,
  linked_project_id UUID REFERENCES projects(id),
  linked_task_id UUID REFERENCES tasks(id),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Syntaxure Labs: Case Studies
-- ============================================================================
CREATE TABLE case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  cover_image_url TEXT,
  technologies TEXT[],
  results JSONB DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Syntaxure Labs: Feedback
-- ============================================================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'responded', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Syntaxure Labs: Subscriptions
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'business', 'custom', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  paypal_subscription_id TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Syntaxure Labs: Notifications
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  type TEXT CHECK (type IN ('project_update', 'invoice', 'quote', 'system')),
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Syntaxure Labs: Invites
-- ============================================================================
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES user_profiles(id),
  role TEXT DEFAULT 'client',
  token TEXT UNIQUE NOT NULL,
  accepted BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Syntaxure Labs: Messages
-- ============================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES user_profiles(id),
  recipient_id UUID REFERENCES user_profiles(id),
  subject TEXT,
  body TEXT,
  read BOOLEAN DEFAULT false,
  thread_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- prism-manage: Tasks
-- ============================================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority INT DEFAULT 0,
  due_date TIMESTAMPTZ,
  google_event_id TEXT,
  notes TEXT,
  parent_task_id UUID REFERENCES tasks(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- prism-manage: Google Calendar Tokens
-- ============================================================================
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id),
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Add calendar_events unique constraint for Google dedup (needs tasks table first)
-- ============================================================================
-- (google_event_id column already on calendar_events, unique handled at app layer)

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_case_studies_slug ON case_studies(slug);
CREATE INDEX idx_case_studies_user_id ON case_studies(user_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_project_id ON feedback(project_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
CREATE POLICY "Anyone can read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON user_profiles FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
);

-- projects policies
CREATE POLICY "Owner can manage projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can manage all projects" ON projects FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
);
CREATE POLICY "Clients can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);

-- milestones policies
CREATE POLICY "Owner can manage milestones" ON milestones FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM projects WHERE id = project_id)
);
CREATE POLICY "Managers can manage all milestones" ON milestones FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
);

-- quotes policies
CREATE POLICY "Owner can manage quotes" ON quotes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can manage all quotes" ON quotes FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
);

-- invoices policies
CREATE POLICY "Owner can manage invoices" ON invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can manage all invoices" ON invoices FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
);

-- calendar_events policies
CREATE POLICY "Owner can manage calendar" ON calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can view all calendar" ON calendar_events FOR SELECT USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
);

-- case_studies policies
CREATE POLICY "Owner can manage case studies" ON case_studies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can manage all case studies" ON case_studies FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
);
CREATE POLICY "Anyone can read published case studies" ON case_studies FOR SELECT USING (published = true);

-- feedback policies
CREATE POLICY "Owner can manage feedback" ON feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Managers can view all feedback" ON feedback FOR SELECT USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
);

-- subscriptions policies
CREATE POLICY "Owner can view subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage subscriptions" ON subscriptions FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
);

-- notifications policies
CREATE POLICY "Owner can manage notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- invites policies
CREATE POLICY "Admins and managers can manage invites" ON invites FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
);

-- messages policies
CREATE POLICY "Sender can manage messages" ON messages FOR ALL USING (auth.uid() = sender_id);
CREATE POLICY "Recipient can read messages" ON messages FOR SELECT USING (auth.uid() = recipient_id);

-- tasks policies
CREATE POLICY "Owner can manage tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Assignee can update task status" ON tasks FOR UPDATE USING (auth.uid() = assigned_to);
CREATE POLICY "Managers can manage all tasks" ON tasks FOR ALL USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
);

-- user_tokens policies
CREATE POLICY "Users can manage own tokens" ON user_tokens FOR ALL USING (auth.uid() = user_id);
