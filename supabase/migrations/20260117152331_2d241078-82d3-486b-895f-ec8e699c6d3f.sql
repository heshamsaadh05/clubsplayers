-- Create languages table
CREATE TABLE public.languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create translations table
CREATE TABLE public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(language_code, key)
);

-- Enable RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Everyone can view active languages
CREATE POLICY "Everyone can view active languages"
  ON public.languages FOR SELECT
  USING (is_active = true);

-- Admins can manage all languages
CREATE POLICY "Admins can manage all languages"
  ON public.languages FOR ALL
  USING (is_admin());

-- Everyone can view translations
CREATE POLICY "Everyone can view translations"
  ON public.translations FOR SELECT
  USING (true);

-- Admins can manage translations
CREATE POLICY "Admins can manage translations"
  ON public.translations FOR ALL
  USING (is_admin());

-- Add indexes for better performance
CREATE INDEX idx_translations_language_code ON public.translations(language_code);
CREATE INDEX idx_translations_key ON public.translations(key);
CREATE INDEX idx_translations_category ON public.translations(category);

-- Insert default languages
INSERT INTO public.languages (code, name, native_name, direction, is_active, is_default, order_index) VALUES
('ar', 'Arabic', 'العربية', 'rtl', true, true, 1),
('en', 'English', 'English', 'ltr', true, false, 2);

-- Trigger for updated_at
CREATE TRIGGER update_languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();