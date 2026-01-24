
-- Create function to notify player when consultation status changes
CREATE OR REPLACE FUNCTION public.notify_player_consultation_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_date_formatted text;
  booking_time text;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  booking_date_formatted := to_char(NEW.booking_date, 'YYYY-MM-DD');
  booking_time := NEW.start_time::text;

  -- Notify on confirmation
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      title_ar,
      message,
      message_ar,
      metadata
    ) VALUES (
      NEW.player_user_id,
      'consultation_confirmed',
      'Consultation Confirmed',
      'تم تأكيد الاستشارة',
      'Your consultation on ' || booking_date_formatted || ' at ' || booking_time || ' has been confirmed.' || 
        CASE WHEN NEW.meet_link IS NOT NULL THEN ' Click to join the meeting.' ELSE '' END,
      'تم تأكيد استشارتك بتاريخ ' || booking_date_formatted || ' الساعة ' || booking_time || '.' ||
        CASE WHEN NEW.meet_link IS NOT NULL THEN ' اضغط للانضمام للاجتماع.' ELSE '' END,
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_date', NEW.booking_date,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'meet_link', NEW.meet_link
      )
    );
  END IF;

  -- Notify on cancellation/rejection
  IF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      title_ar,
      message,
      message_ar,
      metadata
    ) VALUES (
      NEW.player_user_id,
      'consultation_cancelled',
      'Consultation Cancelled',
      'تم إلغاء الاستشارة',
      'Your consultation on ' || booking_date_formatted || ' at ' || booking_time || ' has been cancelled.' ||
        CASE WHEN NEW.admin_notes IS NOT NULL THEN ' Reason: ' || NEW.admin_notes ELSE '' END,
      'تم إلغاء استشارتك بتاريخ ' || booking_date_formatted || ' الساعة ' || booking_time || '.' ||
        CASE WHEN NEW.admin_notes IS NOT NULL THEN ' السبب: ' || NEW.admin_notes ELSE '' END,
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_date', NEW.booking_date,
        'start_time', NEW.start_time,
        'admin_notes', NEW.admin_notes
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for consultation status changes
DROP TRIGGER IF EXISTS trigger_notify_player_consultation_status ON consultation_bookings;
CREATE TRIGGER trigger_notify_player_consultation_status
  AFTER UPDATE ON consultation_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_player_consultation_status_change();

-- Add column to track admin reminder sent
ALTER TABLE consultation_bookings 
ADD COLUMN IF NOT EXISTS admin_reminder_sent boolean NOT NULL DEFAULT false;
