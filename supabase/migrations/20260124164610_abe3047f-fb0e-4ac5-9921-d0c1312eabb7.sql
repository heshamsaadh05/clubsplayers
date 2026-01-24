-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create a more restrictive insert policy - only admins and system can insert
-- The edge function will use service_role key which bypasses RLS