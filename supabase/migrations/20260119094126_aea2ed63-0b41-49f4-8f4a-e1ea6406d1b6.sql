-- Drop the existing view and recreate without security_invoker
DROP VIEW IF EXISTS public.payment_methods_public;

CREATE VIEW public.payment_methods_public
WITH (security_barrier = false)
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

-- Grant SELECT access to everyone (including anonymous users)
GRANT SELECT ON public.payment_methods_public TO anon;
GRANT SELECT ON public.payment_methods_public TO authenticated;