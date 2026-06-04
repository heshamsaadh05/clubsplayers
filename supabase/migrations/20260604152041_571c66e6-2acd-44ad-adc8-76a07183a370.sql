
-- 1. Replace players_public view: expose age, drop date_of_birth
DROP VIEW IF EXISTS public.players_public CASCADE;
CREATE VIEW public.players_public
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.user_id,
  p.full_name,
  p."position",
  p.nationality,
  p.bio,
  p.profile_image_url,
  p.video_urls,
  p.height_cm,
  p.weight_kg,
  p.status,
  p.created_at,
  p.updated_at,
  CASE WHEN pp.date_of_birth IS NOT NULL
       THEN date_part('year', age(pp.date_of_birth))::int
       ELSE NULL END AS age
FROM public.players p
LEFT JOIN public.player_private pp ON p.user_id = pp.user_id
WHERE p.status = 'approved'::player_status;

GRANT SELECT ON public.players_public TO anon, authenticated;

-- 2. payment_methods: remove public SELECT, keep admin-only
DROP POLICY IF EXISTS "Everyone can view active payment methods" ON public.payment_methods;

-- 3. user_roles: explicit restrictive INSERT policy for non-admins
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (public.is_admin());

-- 4. Public buckets: drop broad listing policies (files still accessible via direct public URL)
DROP POLICY IF EXISTS "Anyone can view page images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view player images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view player videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view club logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view slider images" ON storage.objects;
DROP POLICY IF EXISTS "Site assets are publicly accessible" ON storage.objects;

-- 5. Revoke EXECUTE on trigger-only SECURITY DEFINER functions from anon/authenticated/public
REVOKE EXECUTE ON FUNCTION public.ensure_club_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_player_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_consultation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_player_consultation_status_change() FROM PUBLIC, anon, authenticated;
