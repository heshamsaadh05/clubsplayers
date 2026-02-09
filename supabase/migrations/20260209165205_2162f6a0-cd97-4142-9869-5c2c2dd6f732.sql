-- Allow admins to upload/update/delete player images in any folder
CREATE POLICY "Admins can upload player images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'player-images'
  AND public.is_admin()
);

CREATE POLICY "Admins can update player images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'player-images'
  AND public.is_admin()
);

CREATE POLICY "Admins can delete player images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'player-images'
  AND public.is_admin()
);