-- Drop and recreate the payment_methods_public view to exclude API secrets from config
-- The view should only expose payment destination info (account numbers, wallet numbers, emails)
-- but NOT API secrets (client_secret, secret_key, webhook_secret, etc.)

DROP VIEW IF EXISTS public.payment_methods_public;

CREATE VIEW public.payment_methods_public
WITH (security_invoker = true)
AS SELECT 
    id,
    name,
    name_ar,
    type,
    is_active,
    -- Filter the config to only include safe, public-facing fields
    -- Remove any API secrets like client_secret, secret_key, webhook_secret, etc.
    CASE 
        WHEN type = 'bank_transfer' THEN config
        WHEN type = 'wallet' THEN config
        WHEN type = 'paypal' THEN 
            jsonb_build_object(
                'email', COALESCE(config->>'email', ''),
                'mode', COALESCE(config->>'mode', 'sandbox')
            )
        WHEN type = 'stripe' THEN 
            jsonb_build_object(
                'publishable_key', COALESCE(config->>'publishable_key', '')
            )
        WHEN type = 'fawry' THEN 
            jsonb_build_object(
                'merchant_code', COALESCE(config->>'merchant_code', '')
            )
        WHEN type = 'opay' THEN 
            jsonb_build_object(
                'merchant_id', COALESCE(config->>'merchant_id', '')
            )
        WHEN type = '2checkout' THEN 
            jsonb_build_object(
                'merchant_code', COALESCE(config->>'merchant_code', ''),
                'account_number', COALESCE(config->>'account_number', '')
            )
        ELSE '{}'::jsonb
    END AS config,
    instructions,
    instructions_ar,
    created_at,
    updated_at
FROM public.payment_methods
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.payment_methods_public TO anon;
GRANT SELECT ON public.payment_methods_public TO authenticated;