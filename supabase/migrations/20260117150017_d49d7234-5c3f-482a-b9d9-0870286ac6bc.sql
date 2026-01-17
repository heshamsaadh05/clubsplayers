-- Create table to track club usage/limits
CREATE TABLE public.club_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  player_views INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  favorites_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.club_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Clubs can view own usage"
ON public.club_usage
FOR SELECT
USING (auth.uid() = club_user_id);

-- Users can insert their own usage
CREATE POLICY "Clubs can insert own usage"
ON public.club_usage
FOR INSERT
WITH CHECK (auth.uid() = club_user_id);

-- Users can update their own usage
CREATE POLICY "Clubs can update own usage"
ON public.club_usage
FOR UPDATE
USING (auth.uid() = club_user_id);

-- Admins can manage all usage
CREATE POLICY "Admins can manage all usage"
ON public.club_usage
FOR ALL
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_club_usage_updated_at
BEFORE UPDATE ON public.club_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table to track player views (to avoid duplicates)
CREATE TABLE public.player_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_user_id, player_id)
);

-- Enable RLS
ALTER TABLE public.player_views ENABLE ROW LEVEL SECURITY;

-- Clubs can view their own views
CREATE POLICY "Clubs can view own player views"
ON public.player_views
FOR SELECT
USING (auth.uid() = club_user_id);

-- Clubs can insert their own views
CREATE POLICY "Clubs can insert own player views"
ON public.player_views
FOR INSERT
WITH CHECK (auth.uid() = club_user_id);

-- Admins can manage all views
CREATE POLICY "Admins can manage all player views"
ON public.player_views
FOR ALL
USING (is_admin());