-- Add date range support to consultation_slots table
ALTER TABLE public.consultation_slots 
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS recurrence_type text NOT NULL DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS specific_dates date[] DEFAULT '{}';

-- Update existing slots to have proper recurrence type
UPDATE public.consultation_slots 
SET recurrence_type = 'weekly' 
WHERE recurrence_type IS NULL;

COMMENT ON COLUMN public.consultation_slots.start_date IS 'Optional start date for the slot availability';
COMMENT ON COLUMN public.consultation_slots.end_date IS 'Optional end date for the slot availability';
COMMENT ON COLUMN public.consultation_slots.recurrence_type IS 'weekly (default), specific_dates, or date_range';
COMMENT ON COLUMN public.consultation_slots.specific_dates IS 'Array of specific dates when this slot is available';