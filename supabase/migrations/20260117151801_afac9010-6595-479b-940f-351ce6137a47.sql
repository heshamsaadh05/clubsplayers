-- Add auto_renew column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT false;

-- Add renewal_reminder_sent column to track if reminder was sent
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS renewal_reminder_sent BOOLEAN NOT NULL DEFAULT false;

-- Create renewal_logs table to track automatic renewals
CREATE TABLE IF NOT EXISTS public.renewal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  old_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  new_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on renewal_logs
ALTER TABLE public.renewal_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage all renewal logs
CREATE POLICY "Admins can manage all renewal logs"
  ON public.renewal_logs
  FOR ALL
  USING (is_admin());

-- Users can view their own renewal logs
CREATE POLICY "Users can view own renewal logs"
  ON public.renewal_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s 
      WHERE s.id = renewal_logs.subscription_id 
      AND s.user_id = auth.uid()
    )
  );

-- Add index for faster queries on expiring subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date_status 
  ON public.subscriptions(end_date, status) 
  WHERE status = 'active';