-- Backfill missing roles for existing players/clubs
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'player'::public.app_role
FROM public.players p
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT c.user_id, 'club'::public.app_role
FROM public.clubs c
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure role rows are created automatically for future records
CREATE OR REPLACE FUNCTION public.ensure_player_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'player'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_player_role ON public.players;
CREATE TRIGGER trg_ensure_player_role
AFTER INSERT ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.ensure_player_role();


CREATE OR REPLACE FUNCTION public.ensure_club_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'club'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_club_role ON public.clubs;
CREATE TRIGGER trg_ensure_club_role
AFTER INSERT ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION public.ensure_club_role();
