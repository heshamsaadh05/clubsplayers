-- Create private table to store player PII and sensitive fields
CREATE TABLE IF NOT EXISTS public.player_private (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  phone text NULL,
  date_of_birth date NULL,
  id_document_url text NULL,
  rejection_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_private ENABLE ROW LEVEL SECURITY;

-- RLS: admins can manage all
DROP POLICY IF EXISTS "Admins can manage all player private data" ON public.player_private;
CREATE POLICY "Admins can manage all player private data"
ON public.player_private
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- RLS: players can view/insert/update their own private data
DROP POLICY IF EXISTS "Players can view own private data" ON public.player_private;
CREATE POLICY "Players can view own private data"
ON public.player_private
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Players can insert own private data" ON public.player_private;
CREATE POLICY "Players can insert own private data"
ON public.player_private
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Players can update own private data" ON public.player_private;
CREATE POLICY "Players can update own private data"
ON public.player_private
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger function already exists: public.update_updated_at_column()
DROP TRIGGER IF EXISTS update_player_private_updated_at ON public.player_private;
CREATE TRIGGER update_player_private_updated_at
BEFORE UPDATE ON public.player_private
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill player_private from existing players data
INSERT INTO public.player_private (user_id, email, phone, date_of_birth, id_document_url, rejection_reason)
SELECT user_id, email, phone, date_of_birth, id_document_url, rejection_reason
FROM public.players
ON CONFLICT (user_id)
DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  id_document_url = EXCLUDED.id_document_url,
  rejection_reason = EXCLUDED.rejection_reason,
  updated_at = now();

-- Remove sensitive columns from players table to prevent PII exposure to clubs
ALTER TABLE public.players
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS date_of_birth,
  DROP COLUMN IF EXISTS id_document_url,
  DROP COLUMN IF EXISTS rejection_reason;

-- Ensure clubs cannot read sensitive data from players (now removed)
-- Existing players_public view already excludes sensitive fields.
