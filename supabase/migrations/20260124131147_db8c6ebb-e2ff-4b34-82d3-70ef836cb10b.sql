-- Consultation settings table (admin controls)
CREATE TABLE public.consultation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  description_ar TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultation_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for consultation_settings
CREATE POLICY "Everyone can view consultation settings"
  ON public.consultation_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage consultation settings"
  ON public.consultation_settings
  FOR ALL
  USING (is_admin());

-- Insert default settings
INSERT INTO public.consultation_settings (fee, currency, duration_minutes, description, description_ar)
VALUES (50, 'USD', 30, 'One-on-one consultation with admin via Google Meet', 'استشارة فردية مع المدير عبر Google Meet');

-- Consultation time slots table (admin defines available slots)
CREATE TABLE public.consultation_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;

-- RLS policies for consultation_slots
CREATE POLICY "Everyone can view active slots"
  ON public.consultation_slots
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage slots"
  ON public.consultation_slots
  FOR ALL
  USING (is_admin());

-- Consultation bookings table
CREATE TABLE public.consultation_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_user_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
  fee_amount NUMERIC NOT NULL,
  fee_currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT,
  payment_reference TEXT,
  proof_url TEXT,
  meet_link TEXT,
  player_notes TEXT,
  admin_notes TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for consultation_bookings
CREATE POLICY "Players can view own bookings"
  ON public.consultation_bookings
  FOR SELECT
  USING (auth.uid() = player_user_id);

CREATE POLICY "Players can insert own bookings"
  ON public.consultation_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = player_user_id);

CREATE POLICY "Players can update own pending bookings"
  ON public.consultation_bookings
  FOR UPDATE
  USING (auth.uid() = player_user_id AND status = 'pending');

CREATE POLICY "Admins can manage all bookings"
  ON public.consultation_bookings
  FOR ALL
  USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_consultation_settings_updated_at
  BEFORE UPDATE ON public.consultation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_slots_updated_at
  BEFORE UPDATE ON public.consultation_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_bookings_updated_at
  BEFORE UPDATE ON public.consultation_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();