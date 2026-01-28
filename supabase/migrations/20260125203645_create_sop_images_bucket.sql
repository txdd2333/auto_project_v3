-- Create sop-images Storage Bucket
-- 
-- 1. New Bucket
--   - sop-images: Stores SOP document images
--   - Public: true (allow public read access)
--   - File size limit: 10MB
--   - Allowed MIME types: image/*
-- 
-- 2. Notes
--   - This bucket was referenced in previous migrations but never created
--   - RLS policies for this bucket already exist

-- Create the sop-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sop-images',
  'sop-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;