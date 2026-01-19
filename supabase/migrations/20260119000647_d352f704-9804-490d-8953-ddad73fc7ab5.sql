-- Fix player_ratings RLS policies to allow clubs with subscriptions to rate

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Clubs can add ratings" ON public.player_ratings;
DROP POLICY IF EXISTS "Clubs can view ratings" ON public.player_ratings;

-- Create new policy: Clubs (users with active subscription who are in clubs table) can add ratings
CREATE POLICY "Clubs can add ratings" 
ON public.player_ratings 
FOR INSERT 
WITH CHECK (
  auth.uid() = club_user_id 
  AND EXISTS (
    SELECT 1 FROM public.clubs WHERE clubs.user_id = auth.uid()
  )
  AND has_active_subscription(auth.uid())
);

-- Create new policy: Anyone with active subscription can view ratings
CREATE POLICY "Subscribed users can view ratings" 
ON public.player_ratings 
FOR SELECT 
USING (has_active_subscription(auth.uid()) OR is_admin());