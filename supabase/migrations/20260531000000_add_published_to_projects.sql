-- Migration: Add published column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;
