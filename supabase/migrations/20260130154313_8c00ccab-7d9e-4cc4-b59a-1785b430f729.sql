-- Add explicit policy to deny all anonymous access to player_interests table
-- This ensures competitive intelligence (club interest in players) is protected
CREATE POLICY "Block anonymous access to player interests"
ON public.player_interests
FOR ALL
TO anon
USING (false)
WITH CHECK (false);