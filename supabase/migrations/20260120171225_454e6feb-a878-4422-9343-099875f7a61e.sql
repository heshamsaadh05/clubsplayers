-- Create a public view for custom_color_templates that excludes created_by for privacy
CREATE VIEW public.custom_color_templates_public
WITH (security_invoker = true)
AS SELECT 
  id,
  name,
  colors,
  created_at,
  updated_at
FROM public.custom_color_templates;

-- Grant access to the public view
GRANT SELECT ON public.custom_color_templates_public TO anon;
GRANT SELECT ON public.custom_color_templates_public TO authenticated;

-- Drop the overly permissive public read policy on the base table
DROP POLICY IF EXISTS "Everyone can view custom templates" ON public.custom_color_templates;

-- Create restrictive policies on the base table
-- Only admins and template creators can read from the base table directly
CREATE POLICY "Admins can manage all templates"
ON public.custom_color_templates
FOR ALL
USING (is_admin());

CREATE POLICY "Creators can view and manage own templates"
ON public.custom_color_templates
FOR ALL
USING (auth.uid() = created_by);