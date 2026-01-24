-- Add storage policy for players to upload payment proofs for consultations
CREATE POLICY "Players can upload consultation payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add storage policy for players to view their own payment proofs
CREATE POLICY "Players can view own payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);