
-- Trigger functions: should never be called directly via API
REVOKE ALL ON FUNCTION public.notify_player_consultation_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins_new_consultation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_player_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_club_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Helper functions used inside RLS policies: revoke from PUBLIC/anon, keep for authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
