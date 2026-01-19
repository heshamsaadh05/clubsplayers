-- Fix: Allow players to send messages (reply) without subscription limits
-- The current RLS allows users to send messages where sender_id = auth.uid()
-- But we need to ensure players can reply

-- Drop and recreate the message insert policy to be more permissive
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Also ensure players can view ratings (for their own profile)
DROP POLICY IF EXISTS "Players can view their own ratings" ON public.player_ratings;

CREATE POLICY "Players can view their own ratings" 
ON public.player_ratings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.players 
    WHERE players.id = player_ratings.player_id 
    AND players.user_id = auth.uid()
  )
);