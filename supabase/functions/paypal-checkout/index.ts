import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayPalConfig {
  client_id: string;
  client_secret: string;
  mode: 'sandbox' | 'live';
}

async function getPayPalAccessToken(config: PayPalConfig): Promise<string> {
  const baseUrl = config.mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${config.client_id}:${config.client_secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal auth error:', error);
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function createPayPalOrder(
  accessToken: string, 
  amount: number, 
  currency: string,
  mode: 'sandbox' | 'live',
  returnUrl: string,
  cancelUrl: string
): Promise<{ id: string; approvalUrl: string }> {
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
      }],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: 'PAY_NOW',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal create order error:', error);
    throw new Error('Failed to create PayPal order');
  }

  const data = await response.json();
  const approvalLink = data.links.find((link: { rel: string }) => link.rel === 'approve');
  
  return {
    id: data.id,
    approvalUrl: approvalLink?.href || '',
  };
}

async function capturePayPalOrder(
  accessToken: string, 
  orderId: string,
  mode: 'sandbox' | 'live'
): Promise<{ status: string; captureId: string }> {
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal capture error:', error);
    throw new Error('Failed to capture PayPal order');
  }

  const data = await response.json();
  const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';
  
  return {
    status: data.status,
    captureId,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    const { action, planId, orderId, returnUrl, cancelUrl } = await req.json();

    // Get PayPal config
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .select('config')
      .eq('type', 'paypal')
      .eq('is_active', true)
      .single();

    if (pmError || !paymentMethod?.config) {
      console.error('PayPal config error:', pmError);
      return new Response(
        JSON.stringify({ error: 'PayPal is not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = paymentMethod.config as unknown as PayPalConfig;
    
    if (!config.client_id || !config.client_secret) {
      return new Response(
        JSON.stringify({ error: 'PayPal credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getPayPalAccessToken(config);

    if (action === 'create-order') {
      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const order = await createPayPalOrder(
        accessToken,
        Number(plan.price),
        plan.currency,
        config.mode || 'sandbox',
        returnUrl,
        cancelUrl
      );

      console.log('PayPal order created:', order.id);

      return new Response(
        JSON.stringify({ 
          orderId: order.id, 
          approvalUrl: order.approvalUrl 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'capture-order') {
      const capture = await capturePayPalOrder(accessToken, orderId, config.mode || 'sandbox');

      if (capture.status !== 'COMPLETED') {
        return new Response(
          JSON.stringify({ error: 'Payment not completed', status: capture.status }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get plan to calculate end date
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (!plan) {
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days);

      // Create subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          payment_method: 'paypal',
          payment_reference: capture.captureId,
          status: 'active',
          end_date: endDate.toISOString(),
        });

      if (subError) {
        console.error('Subscription insert error:', subError);
        return new Response(
          JSON.stringify({ error: 'Failed to create subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Subscription created for user:', userId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          captureId: capture.captureId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (err) {
    console.error('PayPal checkout error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
