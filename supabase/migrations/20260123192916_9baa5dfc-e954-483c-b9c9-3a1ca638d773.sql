-- Create player_interests table for clubs to express interest to admin
CREATE TABLE public.player_interests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID NOT NULL,
    club_user_id UUID NOT NULL,
    interest_type TEXT NOT NULL DEFAULT 'interested', -- 'interested', 'offer'
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'contacted', 'rejected'
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_club_player_interest UNIQUE (club_user_id, player_id)
);

-- Enable RLS
ALTER TABLE public.player_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clubs can insert own interests"
ON public.player_interests
FOR INSERT
WITH CHECK (auth.uid() = club_user_id AND has_role(auth.uid(), 'club'));

CREATE POLICY "Clubs can view own interests"
ON public.player_interests
FOR SELECT
USING (auth.uid() = club_user_id);

CREATE POLICY "Clubs can update own pending interests"
ON public.player_interests
FOR UPDATE
USING (auth.uid() = club_user_id AND status = 'pending');

CREATE POLICY "Clubs can delete own pending interests"
ON public.player_interests
FOR DELETE
USING (auth.uid() = club_user_id AND status = 'pending');

CREATE POLICY "Admins can manage all interests"
ON public.player_interests
FOR ALL
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_player_interests_updated_at
BEFORE UPDATE ON public.player_interests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update players_public view to include date_of_birth for age but remove current_club and previous_clubs
DROP VIEW IF EXISTS public.players_public;

CREATE VIEW public.players_public AS
SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.position,
    p.nationality,
    p.bio,
    p.profile_image_url,
    p.video_urls,
    p.height_cm,
    p.weight_kg,
    p.status,
    p.created_at,
    p.updated_at,
    pp.date_of_birth
FROM players p
LEFT JOIN player_private pp ON p.user_id = pp.user_id
WHERE p.status = 'approved'::player_status;

-- Grant access
GRANT SELECT ON public.players_public TO anon;
GRANT SELECT ON public.players_public TO authenticated;