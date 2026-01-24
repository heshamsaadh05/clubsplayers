
-- Create function to notify admins when a new consultation booking is created
CREATE OR REPLACE FUNCTION public.notify_admins_new_consultation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
  player_name text;
BEGIN
  -- Get player name
  SELECT full_name INTO player_name
  FROM players
  WHERE user_id = NEW.player_user_id;

  -- Loop through all admin users and create notification for each
  FOR admin_user_id IN 
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      title_ar,
      message,
      message_ar,
      metadata
    ) VALUES (
      admin_user_id,
      'new_consultation_booking',
      'New Consultation Request',
      'طلب استشارة جديد',
      'A new consultation booking request from ' || COALESCE(player_name, 'a player') || ' on ' || NEW.booking_date::text || ' at ' || NEW.start_time::text,
      'طلب حجز استشارة جديد من ' || COALESCE(player_name, 'لاعب') || ' بتاريخ ' || NEW.booking_date::text || ' الساعة ' || NEW.start_time::text,
      jsonb_build_object(
        'booking_id', NEW.id,
        'player_user_id', NEW.player_user_id,
        'booking_date', NEW.booking_date,
        'start_time', NEW.start_time,
        'fee_amount', NEW.fee_amount,
        'fee_currency', NEW.fee_currency
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for new consultation bookings
DROP TRIGGER IF EXISTS trigger_notify_admins_new_consultation ON consultation_bookings;
CREATE TRIGGER trigger_notify_admins_new_consultation
  AFTER INSERT ON consultation_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_consultation();
