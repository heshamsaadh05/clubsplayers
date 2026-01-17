-- Create a helper function to check for active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = uid
      AND status = 'active'
      AND end_date >= now()
  )
$$;

-- Create a public view that excludes sensitive PII fields
-- This view only exposes safe player data for browsing
CREATE OR REPLACE VIEW public.players_public
WITH (security_invoker = on)
AS SELECT 
  id,
  user_id,
  full_name,
  position,
  nationality,
  current_club,
  previous_clubs,
  bio,
  profile_image_url,
  video_urls,
  height_cm,
  weight_kg,
  status,
  created_at,
  updated_at
FROM public.players
WHERE status = 'approved';

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.players_public TO authenticated;

-- Drop the overly permissive policy that exposes all data to any authenticated user
DROP POLICY IF EXISTS "Approved players visible to subscribers" ON public.players;

-- Create a more restrictive policy that:
-- 1. Allows players to view their own data (needed for editing their profile)
-- 2. Allows admins to view all data (needed for admin panel)
-- 3. Denies direct table access to other users (they should use the view)
CREATE POLICY "Players can view own full data"
ON public.players
FOR SELECT
USING (auth.uid() = user_id);

-- Note: Admin policy already exists via "Admins can manage all players"
-- The view handles public browsing with limited fields