-- Fix security definer view warning by adding security_invoker = true
DROP VIEW IF EXISTS public.players_public;

CREATE VIEW public.players_public
WITH (security_invoker = true)
AS SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.position,
    p.nationality,
    p.bio,
    p.profile_image_url,
    p.video_urls,
    p.height_cm,
    p.weight_kg,
    p.status,
    p.created_at,
    p.updated_at,
    pp.date_of_birth
FROM players p
LEFT JOIN player_private pp ON p.user_id = pp.user_id
WHERE p.status = 'approved'::player_status;

-- Grant access
GRANT SELECT ON public.players_public TO anon;
GRANT SELECT ON public.players_public TO authenticated;