-- Create player ratings table
CREATE TABLE public.player_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  club_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_id, club_user_id)
);

-- Enable RLS
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;

-- Clubs can view all ratings
CREATE POLICY "Clubs can view ratings"
ON public.player_ratings
FOR SELECT
USING (has_role(auth.uid(), 'club'));

-- Clubs can add their own ratings
CREATE POLICY "Clubs can add ratings"
ON public.player_ratings
FOR INSERT
WITH CHECK (auth.uid() = club_user_id AND has_role(auth.uid(), 'club'));

-- Clubs can update their own ratings
CREATE POLICY "Clubs can update own ratings"
ON public.player_ratings
FOR UPDATE
USING (auth.uid() = club_user_id);

-- Clubs can delete their own ratings
CREATE POLICY "Clubs can delete own ratings"
ON public.player_ratings
FOR DELETE
USING (auth.uid() = club_user_id);

-- Admins can manage all ratings
CREATE POLICY "Admins can manage all ratings"
ON public.player_ratings
FOR ALL
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_player_ratings_updated_at
BEFORE UPDATE ON public.player_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();