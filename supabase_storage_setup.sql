-- 1. Create the 'avatars' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for 'avatars' Bucket

-- Enable RLS (already enabled by default in Supabase storage, but ensuring here)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access to view downloaded avatars (SELECT)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars'
);

-- Allow authenticated users to upload new avatars (INSERT)
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update their own existing avatars (UPDATE)
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their own existing avatars (DELETE)
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);
