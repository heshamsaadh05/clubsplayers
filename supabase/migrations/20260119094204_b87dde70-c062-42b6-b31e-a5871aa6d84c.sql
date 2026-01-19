-- Drop restrictive policy and recreate to allow public read of active payment methods
DROP POLICY IF EXISTS "Only admins can view payment methods directly" ON public.payment_methods;
DROP POLICY IF EXISTS "Everyone can view active payment methods" ON public.payment_methods;

-- Allow everyone to view active payment methods
CREATE POLICY "Everyone can view active payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (is_active = true);