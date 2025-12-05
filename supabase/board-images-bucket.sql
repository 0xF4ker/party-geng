-- ===== NEW: BOARD IMAGES BUCKET AND POLICIES =====

-- 5. Create board-images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('board-images', 'board-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own board images
CREATE POLICY "Users can upload their own board images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'board-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own board images
CREATE POLICY "Users can update their own board images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'board-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own board images
CREATE POLICY "Users can delete their own board images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'board-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view board images (public bucket)
CREATE POLICY "Anyone can view board images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'board-images');
