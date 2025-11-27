-- Create storage buckets for profile images and KYC documents
-- Run this in Supabase SQL Editor

-- 1. Create profile-images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create kyc-documents bucket (private - only user can access their own)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ===== STORAGE POLICIES FOR PROFILE IMAGES =====

-- Allow users to upload their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view profile images (public bucket)
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- ===== STORAGE POLICIES FOR KYC DOCUMENTS =====

-- Allow vendors to upload their own KYC documents
CREATE POLICY "Vendors can upload their own KYC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow vendors to update their own KYC documents
CREATE POLICY "Vendors can update their own KYC documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow vendors to delete their own KYC documents
CREATE POLICY "Vendors can delete their own KYC documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own KYC documents
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ===== HELPER FUNCTION TO GET FILE EXTENSION =====
CREATE OR REPLACE FUNCTION get_file_extension(filename text)
RETURNS text AS $$
BEGIN
  RETURN lower(substring(filename from '\.([^\.]*)$'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===== NEW: POSTS BUCKET AND POLICIES =====

-- 3. Create posts bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own post assets
CREATE POLICY "Users can upload their own post assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own post assets
CREATE POLICY "Users can update their own post assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own post assets
CREATE POLICY "Users can delete their own post assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view post assets (public bucket)
CREATE POLICY "Anyone can view post assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts');

-- ===== NEW: WISHLIST IMAGES BUCKET AND POLICIES =====

-- 4. Create wishlist-images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('wishlist-images', 'wishlist-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own wishlist images
CREATE POLICY "Users can upload their own wishlist images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wishlist-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own wishlist images
CREATE POLICY "Users can update their own wishlist images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wishlist-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own wishlist images
CREATE POLICY "Users can delete their own wishlist images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wishlist-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view wishlist images (public bucket)
CREATE POLICY "Anyone can view wishlist images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wishlist-images');
