
-- Create storage bucket for community images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('community-images', 'community-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload community images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-images');

-- Allow public read access
CREATE POLICY "Public can view community images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'community-images');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own community images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'community-images' AND (storage.foldername(name))[1] = auth.uid()::text);
