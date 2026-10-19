-- Migration: payment proof uploads (syntaxure-labs GCash flow)
-- -------------------------------------------------------------
-- Private bucket for payment screenshots. Writes happen through signed upload
-- URLs minted server-side (service role); reads are signed on demand by
-- admin tooling. Never public: proofs contain payer names and amounts.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

-- Service role manages the bucket (signed uploads + admin reads).
-- No anon/authenticated policies: clients never talk to storage directly
-- beyond the pre-signed URL.
DROP POLICY IF EXISTS "Service role can manage payment proofs" ON storage.objects;
CREATE POLICY "Service role can manage payment proofs" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'payment-proofs')
  WITH CHECK (bucket_id = 'payment-proofs');
