-- Drop the old incorrect policy
DROP POLICY IF EXISTS "Players can upload consultation payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Players can view own payment proofs" ON storage.objects;

-- Create correct policy for consultations path: consultations/{user_id}/...
CREATE POLICY "Players can upload consultation payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- Create correct SELECT policy
CREATE POLICY "Players can view own payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND (auth.uid())::text = (storage.foldername(name))[2]
);