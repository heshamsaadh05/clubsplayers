-- Create table to track Google Meet meetings
CREATE TABLE public.google_meet_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.consultation_bookings(id) ON DELETE CASCADE,
  meet_link TEXT NOT NULL,
  calendar_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  player_user_id UUID NOT NULL,
  player_name TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT,
  regenerated_count INTEGER NOT NULL DEFAULT 0
);

-- Add constraint for valid status values
ALTER TABLE public.google_meet_logs 
  ADD CONSTRAINT google_meet_logs_status_check 
  CHECK (status IN ('created', 'active', 'completed', 'cancelled', 'error', 'expired'));

-- Create index for faster queries
CREATE INDEX idx_google_meet_logs_booking_id ON public.google_meet_logs(booking_id);
CREATE INDEX idx_google_meet_logs_status ON public.google_meet_logs(status);
CREATE INDEX idx_google_meet_logs_booking_date ON public.google_meet_logs(booking_date);

-- Enable RLS
ALTER TABLE public.google_meet_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all meet logs"
  ON public.google_meet_logs
  FOR ALL
  USING (is_admin());

CREATE POLICY "Players can view own meet logs"
  ON public.google_meet_logs
  FOR SELECT
  USING (auth.uid() = player_user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_google_meet_logs_updated_at
  BEFORE UPDATE ON public.google_meet_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();