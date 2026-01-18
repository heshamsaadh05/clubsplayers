-- Add RLS policy for clubs with active subscriptions to view approved players
-- This allows the players_public view to work correctly for club users

-- Policy to allow clubs with active subscriptions to view approved players
CREATE POLICY "Clubs with active subscription can view approved players"
ON public.players
FOR SELECT
TO authenticated
USING (
  status = 'approved' 
  AND has_active_subscription(auth.uid())
);