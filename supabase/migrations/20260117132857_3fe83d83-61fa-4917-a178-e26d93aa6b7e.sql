-- Create storage bucket for club logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-logos', 'club-logos', true);

-- Allow authenticated users to upload their club logo
CREATE POLICY "Users can upload club logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'club-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their club logo
CREATE POLICY "Users can update own club logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'club-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their club logo
CREATE POLICY "Users can delete own club logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'club-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to club logos
CREATE POLICY "Public can view club logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'club-logos');