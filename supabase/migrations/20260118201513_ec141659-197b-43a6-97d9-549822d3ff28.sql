-- Theme settings table for colors
CREATE TABLE public.theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for theme
CREATE POLICY "Theme settings are publicly readable"
ON public.theme_settings FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify theme settings"
ON public.theme_settings FOR ALL
USING (public.is_admin());

-- Section visibility/settings per page
CREATE TABLE public.page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL,
  section_key TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_key, section_key)
);

-- Enable RLS
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Page sections are publicly readable"
ON public.page_sections FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify page sections"
ON public.page_sections FOR ALL
USING (public.is_admin());

-- Slider items table
CREATE TABLE public.slider_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slider_key TEXT NOT NULL DEFAULT 'players',
  title TEXT,
  title_ar TEXT,
  subtitle TEXT,
  subtitle_ar TEXT,
  image_url TEXT,
  link_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.slider_items ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Slider items are publicly readable"
ON public.slider_items FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify slider items"
ON public.slider_items FOR ALL
USING (public.is_admin());

-- Slider settings table
CREATE TABLE public.slider_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slider_key TEXT NOT NULL UNIQUE,
  auto_play BOOLEAN NOT NULL DEFAULT true,
  auto_play_interval INTEGER NOT NULL DEFAULT 5000,
  show_navigation BOOLEAN NOT NULL DEFAULT true,
  show_dots BOOLEAN NOT NULL DEFAULT true,
  items_per_view INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.slider_settings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Slider settings are publicly readable"
ON public.slider_settings FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify slider settings"
ON public.slider_settings FOR ALL
USING (public.is_admin());

-- Insert default theme
INSERT INTO public.theme_settings (key, value) VALUES
('colors', '{
  "primary": "45 100% 51%",
  "primary_foreground": "0 0% 0%",
  "secondary": "0 0% 15%",
  "secondary_foreground": "0 0% 100%",
  "background": "0 0% 5%",
  "foreground": "0 0% 100%",
  "accent": "45 100% 51%",
  "accent_foreground": "0 0% 0%",
  "muted": "0 0% 15%",
  "muted_foreground": "0 0% 65%"
}');

-- Insert default sections for homepage
INSERT INTO public.page_sections (page_key, section_key, is_visible, order_index) VALUES
('home', 'hero', true, 1),
('home', 'features', true, 2),
('home', 'how_it_works', true, 3),
('home', 'players_slider', true, 4),
('home', 'cta', true, 5);

-- Insert default slider settings
INSERT INTO public.slider_settings (slider_key, auto_play, auto_play_interval, show_navigation, show_dots, items_per_view) VALUES
('players', true, 5000, true, true, 3);

-- Triggers for updated_at
CREATE TRIGGER update_theme_settings_updated_at
BEFORE UPDATE ON public.theme_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_sections_updated_at
BEFORE UPDATE ON public.page_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slider_items_updated_at
BEFORE UPDATE ON public.slider_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slider_settings_updated_at
BEFORE UPDATE ON public.slider_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();