-- Allow players to cancel their own bookings (update status to cancelled)
CREATE POLICY "Players can cancel own bookings"
ON public.consultation_bookings
FOR UPDATE
USING (
  auth.uid() = player_user_id 
  AND status IN ('pending', 'confirmed')
)
WITH CHECK (
  auth.uid() = player_user_id 
  AND status = 'cancelled'
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Players can update own pending bookings" ON public.consultation_bookings;