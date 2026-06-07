-- Migration: Make quotes.user_id nullable for public (unauthenticated) quote requests
-- The public quote form at /quote doesn't require authentication,
-- so user_id must be nullable to accept anonymous submissions.

ALTER TABLE quotes ALTER COLUMN user_id DROP NOT NULL;
