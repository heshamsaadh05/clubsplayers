-- Fix the Security Definer View warning by recreating with security_invoker
DROP VIEW IF EXISTS public.payment_methods_public;

CREATE VIEW public.payment_methods_public
WITH (security_invoker = true)
AS SELECT 
  id,
  name,
  name_ar,
  type,
  is_active,
  config,
  instructions,
  instructions_ar,
  created_at,
  updated_at
FROM public.payment_methods
WHERE is_active = true;

-- Grant SELECT access to everyone
GRANT SELECT ON public.payment_methods_public TO anon;
GRANT SELECT ON public.payment_methods_public TO authenticated;