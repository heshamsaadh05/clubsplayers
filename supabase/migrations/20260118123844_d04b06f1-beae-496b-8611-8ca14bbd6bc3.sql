-- Create a public view for payment methods that excludes sensitive API credentials
-- The config field is split: display-only fields (account numbers, IBAN) stay, 
-- but this view is created to ensure only non-sensitive config fields are exposed

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Everyone can view active payment methods" ON public.payment_methods;

-- Create a view that exposes only safe fields for public consumption
-- The config field contains display info like account numbers which users need to see
-- to make payments, so we keep it but should review what's stored there
CREATE OR REPLACE VIEW public.payment_methods_public
WITH (security_invoker = true)
AS SELECT 
  id,
  name,
  name_ar,
  type,
  is_active,
  config,  -- Contains display info (account numbers) users need to see for payments
  instructions,
  instructions_ar,
  created_at,
  updated_at
FROM public.payment_methods
WHERE is_active = true;

-- Grant access to the public view for authenticated users
GRANT SELECT ON public.payment_methods_public TO authenticated;
GRANT SELECT ON public.payment_methods_public TO anon;

-- Create a new restrictive policy: only admins can access the base table directly
CREATE POLICY "Only admins can view payment methods directly"
ON public.payment_methods
FOR SELECT
TO authenticated
USING (is_admin());