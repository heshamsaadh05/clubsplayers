-- Create storage bucket for site logo
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Site assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'site-assets');

-- Create policy for admin upload access
CREATE POLICY "Admins can upload site assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());

-- Create policy for admin update access
CREATE POLICY "Admins can update site assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'site-assets' AND public.is_admin());

-- Create policy for admin delete access
CREATE POLICY "Admins can delete site assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'site-assets' AND public.is_admin());

-- Insert site_logo setting if not exists
INSERT INTO public.site_settings (key, value)
VALUES ('site_logo', '{"type": "text", "image_url": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;