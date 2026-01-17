-- Create menu_items table for managing header and footer navigation
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  url TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('header', 'footer', 'both')),
  is_external BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  parent_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Everyone can view active menu items
CREATE POLICY "Everyone can view active menu items"
ON public.menu_items
FOR SELECT
USING (is_active = true);

-- Admins can manage all menu items
CREATE POLICY "Admins can manage all menu items"
ON public.menu_items
FOR ALL
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default menu items (header)
INSERT INTO public.menu_items (title, title_ar, url, location, order_index) VALUES
('Home', 'الرئيسية', '#home', 'header', 1),
('Services', 'خدماتنا', '#services', 'header', 2),
('Players', 'اللاعبون', '#players', 'header', 3),
('About', 'عن الوكالة', '#about', 'header', 4),
('Contact', 'تواصل معنا', '#contact', 'header', 5);

-- Insert default menu items (footer quick links)
INSERT INTO public.menu_items (title, title_ar, url, location, order_index) VALUES
('Home', 'الرئيسية', '#home', 'footer', 1),
('Services', 'خدماتنا', '#services', 'footer', 2),
('Players', 'اللاعبون', '#players', 'footer', 3),
('About', 'عن الوكالة', '#about', 'footer', 4),
('Contact', 'تواصل معنا', '#contact', 'footer', 5);