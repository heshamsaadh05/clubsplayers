-- Add 'pending' status to subscription_status enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'pending';

-- Add proof_url column to subscriptions for payment proof images
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS proof_url TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
-- Users can upload their own proofs
CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own proofs
CREATE POLICY "Users can view their own payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all proofs
CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND public.is_admin()
);

-- Admins can delete proofs
CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-proofs' 
  AND public.is_admin()
);