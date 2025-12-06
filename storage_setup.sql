-- InvoiceMatch Storage Configuration
-- Version: 1.0.0
-- Generated: 2025-12-05

-- ============================================
-- Storage Bucket Configuration
-- ============================================

-- Create storage bucket for files (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage RLS Policies
-- ============================================

-- Users can upload files to their own folder
CREATE POLICY "Users upload own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view files in their own folder
CREATE POLICY "Users view own files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete files in their own folder
CREATE POLICY "Users delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update files in their own folder
CREATE POLICY "Users update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
