-- Create storage bucket for slider images
INSERT INTO storage.buckets (id, name, public)
VALUES ('slider-images', 'slider-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to slider images
CREATE POLICY "Public can view slider images"
ON storage.objects FOR SELECT
USING (bucket_id = 'slider-images');

-- Allow admins to upload slider images
CREATE POLICY "Admins can upload slider images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'slider-images' 
  AND public.is_admin()
);

-- Allow admins to update slider images
CREATE POLICY "Admins can update slider images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'slider-images' AND public.is_admin());

-- Allow admins to delete slider images
CREATE POLICY "Admins can delete slider images"
ON storage.objects FOR DELETE
USING (bucket_id = 'slider-images' AND public.is_admin());