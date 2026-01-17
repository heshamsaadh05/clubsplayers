-- Create favorites table for clubs to save players
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_user_id UUID NOT NULL,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (club_user_id, player_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Clubs can view their own favorites
CREATE POLICY "Clubs can view own favorites"
ON public.favorites
FOR SELECT
USING (auth.uid() = club_user_id);

-- Clubs can add favorites
CREATE POLICY "Clubs can add favorites"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = club_user_id AND public.has_role(auth.uid(), 'club'));

-- Clubs can remove favorites
CREATE POLICY "Clubs can remove favorites"
ON public.favorites
FOR DELETE
USING (auth.uid() = club_user_id);

-- Admins can manage all favorites
CREATE POLICY "Admins can manage all favorites"
ON public.favorites
FOR ALL
USING (public.is_admin());