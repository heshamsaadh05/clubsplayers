-- Create table for custom color templates
CREATE TABLE public.custom_color_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  colors JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_color_templates ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage custom templates"
ON public.custom_color_templates
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Everyone can view templates (for applying them)
CREATE POLICY "Everyone can view custom templates"
ON public.custom_color_templates
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_color_templates_updated_at
BEFORE UPDATE ON public.custom_color_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();