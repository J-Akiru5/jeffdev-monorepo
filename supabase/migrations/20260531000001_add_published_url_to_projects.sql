-- Migration: Add published_site_url to projects table
-- Stores the live production URL of a finished/published project.
-- Displayed as a "Visit Live Site" CTA on the Syntaxure Labs case study detail page.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS published_site_url TEXT;
