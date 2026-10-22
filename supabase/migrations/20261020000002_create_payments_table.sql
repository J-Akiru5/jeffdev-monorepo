-- Migration: payments (syntaxure-labs public payment flow)
-- --------------------------------------------------------
-- The /pay/[refNo] page records client payments (GCash proofs, Maya, PayPal,
-- bank transfer). Verified payments reduce the invoice balance; pending
-- proofs wait for admin verification.

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'PHP',
  method TEXT NOT NULL,
  transaction_id TEXT,
  -- Bucket-relative path in the private `payment-proofs` bucket
  proof_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice
  ON payments(invoice_id, status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Only the service role touches payments: the public page writes through a
-- server action and admins read/verify through the service client.
DROP POLICY IF EXISTS "Service role can manage payments" ON payments;
CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
