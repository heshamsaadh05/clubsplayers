-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'player', 'club');

-- Create enum for player status
CREATE TYPE public.player_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (CRITICAL: roles stored separately for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create players table
CREATE TABLE public.players (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    height_cm INTEGER,
    weight_kg INTEGER,
    position TEXT,
    nationality TEXT,
    current_club TEXT,
    previous_clubs TEXT[],
    bio TEXT,
    id_document_url TEXT,
    profile_image_url TEXT,
    video_urls TEXT[],
    status player_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clubs table
CREATE TABLE public.clubs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    city TEXT,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription plans table (managed by admin)
CREATE TABLE public.subscription_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    duration_days INTEGER NOT NULL DEFAULT 30,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    plan_type TEXT NOT NULL DEFAULT 'club', -- 'club' or 'player'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status subscription_status NOT NULL DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method TEXT,
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment methods table (managed by admin)
CREATE TABLE public.payment_methods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    type TEXT NOT NULL, -- 'paypal', 'stripe', 'bank_transfer', 'wallet', 'cashier', 'opay', '2checkout'
    is_active BOOLEAN NOT NULL DEFAULT true,
    config JSONB DEFAULT '{}', -- Store account numbers, etc.
    instructions TEXT,
    instructions_ar TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site settings table
CREATE TABLE public.site_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pages table for custom pages
CREATE TABLE public.pages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    title_ar TEXT,
    content TEXT,
    content_ar TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- RLS Policies for players
CREATE POLICY "Players can view own data" ON public.players FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players can update own data" ON public.players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Players can insert own data" ON public.players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all players" ON public.players FOR ALL USING (public.is_admin());
CREATE POLICY "Approved players visible to subscribers" ON public.players FOR SELECT USING (status = 'approved');

-- RLS Policies for clubs
CREATE POLICY "Clubs can view own data" ON public.clubs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Clubs can update own data" ON public.clubs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Clubs can insert own data" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all clubs" ON public.clubs FOR ALL USING (public.is_admin());

-- RLS Policies for subscription_plans (public read, admin write)
CREATE POLICY "Everyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (public.is_admin());

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions FOR ALL USING (public.is_admin());

-- RLS Policies for payment_methods (public read, admin write)
CREATE POLICY "Everyone can view active payment methods" ON public.payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL USING (public.is_admin());

-- RLS Policies for site_settings (admin only)
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Everyone can view site settings" ON public.site_settings FOR SELECT USING (true);

-- RLS Policies for pages
CREATE POLICY "Everyone can view published pages" ON public.pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL USING (public.is_admin());

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
    ('player_registration_fee', '{"enabled": false, "amount": 0, "currency": "USD"}'),
    ('site_name', '{"en": "Stars Agency", "ar": "ستارز إيجنسي"}'),
    ('site_description', '{"en": "Professional Football Players Agency", "ar": "وكالة لاعبي كرة القدم المحترفين"}');

-- Insert default payment methods
INSERT INTO public.payment_methods (name, name_ar, type, is_active, config, instructions, instructions_ar) VALUES
    ('PayPal', 'باي بال', 'paypal', false, '{"email": ""}', 'Send payment to the PayPal email address', 'أرسل الدفع إلى عنوان البريد الإلكتروني الخاص بـ PayPal'),
    ('Stripe', 'سترايب', 'stripe', false, '{}', 'Pay securely with your card', 'ادفع بشكل آمن ببطاقتك'),
    ('Bank Transfer', 'تحويل بنكي', 'bank_transfer', false, '{"bank_name": "", "account_number": "", "iban": ""}', 'Transfer to the bank account and upload receipt', 'حوّل إلى الحساب البنكي وارفع إيصال التحويل'),
    ('E-Wallet', 'محفظة إلكترونية', 'wallet', false, '{"wallet_number": ""}', 'Transfer to wallet number and upload receipt', 'حوّل إلى رقم المحفظة وارفع إيصال التحويل'),
    ('Kashier Egypt', 'كاشير مصر', 'kashier', false, '{}', 'Pay through Kashier', 'ادفع من خلال كاشير'),
    ('OPay Egypt', 'أوباي مصر', 'opay', false, '{}', 'Pay through OPay', 'ادفع من خلال أوباي'),
    ('2Checkout', '2Checkout', '2checkout', false, '{}', 'Pay through 2Checkout', 'ادفع من خلال 2Checkout');

-- Insert default subscription plan for clubs
INSERT INTO public.subscription_plans (name, name_ar, description, description_ar, price, duration_days, plan_type, features) VALUES
    ('Basic', 'الباقة الأساسية', 'Access to player profiles', 'الوصول لملفات اللاعبين', 99.00, 30, 'club', '["View player profiles", "Contact 10 players/month"]'),
    ('Premium', 'الباقة المميزة', 'Full access to all features', 'وصول كامل لجميع المميزات', 199.00, 30, 'club', '["View player profiles", "Unlimited contacts", "Priority support"]');