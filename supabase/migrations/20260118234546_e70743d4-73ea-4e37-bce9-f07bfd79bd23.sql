-- Insert default footer settings
INSERT INTO public.site_settings (key, value) VALUES
('footer_contact', '{"phone": "+20 123 456 7890", "email": "info@starsagency.com", "location": "القاهرة، مصر", "location_en": "Cairo, Egypt"}'),
('footer_social', '{"facebook": "#", "twitter": "#", "instagram": "#", "youtube": "#"}'),
('footer_branding', '{"logo_url": "", "description": "الوكالة الرائدة في اكتشاف المواهب الكروية وربطها بأفضل الأندية حول العالم.", "description_en": "The leading agency in discovering football talents and connecting them with the best clubs worldwide."}')
ON CONFLICT (key) DO NOTHING;