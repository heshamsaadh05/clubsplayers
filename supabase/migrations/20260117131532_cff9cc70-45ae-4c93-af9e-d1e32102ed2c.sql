-- Create storage buckets for player files
INSERT INTO storage.buckets (id, name, public) VALUES ('player-documents', 'player-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('player-images', 'player-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('player-videos', 'player-videos', true);

-- RLS policies for player-documents (private - only owner and admins can access)
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'player-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'player-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'player-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can access all documents"
ON storage.objects FOR ALL
USING (bucket_id = 'player-documents' AND is_admin());

-- RLS policies for player-images (public viewing, owner upload)
CREATE POLICY "Anyone can view player images"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-images');

CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'player-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'player-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'player-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for player-videos (public viewing, owner upload)
CREATE POLICY "Anyone can view player videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-videos');

CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'player-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'player-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'player-videos' AND auth.uid()::text = (storage.foldername(name))[1]);