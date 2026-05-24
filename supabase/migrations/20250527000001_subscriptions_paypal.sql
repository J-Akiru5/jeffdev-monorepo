-- Migration: Add PayPal subscription support to subscriptions table
-- Adds paypal_subscription_id, fixes plan constraint, updates types

-- Add paypal_subscription_id column
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Fix plan CHECK constraint to include 'team' tier
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check,
  ADD CONSTRAINT subscriptions_plan_check
    CHECK (plan IN ('free', 'pro', 'team', 'enterprise'));

-- Fix status CHECK constraint to include 'past_due'
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check,
  ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('active', 'cancelled', 'suspended', 'past_due'));

-- Change date columns to timestamptz for precision
ALTER TABLE subscriptions
  ALTER COLUMN current_period_start TYPE TIMESTAMP WITH TIME ZONE USING current_period_start::TIMESTAMP WITH TIME ZONE,
  ALTER COLUMN current_period_end TYPE TIMESTAMP WITH TIME ZONE USING current_period_end::TIMESTAMP WITH TIME ZONE;

-- Add index on paypal_subscription_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON subscriptions(paypal_subscription_id);

-- RLS policy: service_role can do all operations (for webhook)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscriptions'
      AND policyname = 'Service role can manage subscriptions'
  ) THEN
    CREATE POLICY "Service role can manage subscriptions" ON subscriptions
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END;
$$;
