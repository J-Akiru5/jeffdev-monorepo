-- Supabase Seed Data
-- Inserts a default admin user profile (requires auth.users entry to exist first)
-- Run after creating users via Supabase Auth UI or import script

-- Seed an admin profile placeholder (will be populated by trigger on signup)
-- This is just for reference; actual profiles are auto-created via handle_new_user() trigger

-- Example seed data for testing (uncomment when needed):
/*
INSERT INTO projects (user_id, title, description, status, category, technologies)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Sample Project', 'A sample project for testing', 'draft', 'web', ARRAY['Next.js', 'TypeScript', 'Tailwind CSS']);
*/
