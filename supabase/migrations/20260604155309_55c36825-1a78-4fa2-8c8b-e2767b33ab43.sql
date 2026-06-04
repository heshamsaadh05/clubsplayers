DROP POLICY IF EXISTS "Players can insert own bookings" ON public.consultation_bookings;
CREATE POLICY "Players can insert own bookings"
ON public.consultation_bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player_user_id AND public.has_role(auth.uid(), 'player'::public.app_role));