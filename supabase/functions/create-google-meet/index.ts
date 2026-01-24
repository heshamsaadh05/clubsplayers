import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface BookingDetails {
  bookingId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  playerName?: string;
  playerEmail?: string;
  durationMinutes: number;
  description?: string;
}

// Create a JWT for Google API authentication
async function createJWT(serviceAccount: ServiceAccountKey): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signInput = `${headerB64}.${payloadB64}`;
  
  // Import the private key
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKey.substring(
    privateKey.indexOf(pemHeader) + pemHeader.length,
    privateKey.indexOf(pemFooter)
  ).replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signInput)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return `${signInput}.${signatureB64}`;
}

// Get access token from Google
async function getAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  const jwt = await createJWT(serviceAccount);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Token error:', error);
    throw new Error(`Failed to get access token: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Create Google Calendar event with Meet link
async function createCalendarEvent(
  accessToken: string,
  booking: BookingDetails,
  calendarId: string = 'primary'
): Promise<{ meetLink: string; eventId: string }> {
  const startDateTime = `${booking.bookingDate}T${booking.startTime}:00`;
  const endDateTime = `${booking.bookingDate}T${booking.endTime}:00`;
  
  const event = {
    summary: `استشارة مع ${booking.playerName || 'لاعب'}`,
    description: booking.description || 'جلسة استشارة عبر Google Meet',
    start: {
      dateTime: startDateTime,
      timeZone: 'Africa/Cairo',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Africa/Cairo',
    },
    conferenceData: {
      createRequest: {
        requestId: `consultation-${booking.bookingId}-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    },
    attendees: booking.playerEmail ? [{ email: booking.playerEmail }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Calendar event error:', error);
    throw new Error(`Failed to create calendar event: ${error}`);
  }
  
  const createdEvent = await response.json();
  
  const meetLink = createdEvent.conferenceData?.entryPoints?.find(
    (ep: { entryPointType: string }) => ep.entryPointType === 'video'
  )?.uri || createdEvent.hangoutLink;
  
  if (!meetLink) {
    throw new Error('Failed to generate Meet link');
  }
  
  return {
    meetLink,
    eventId: createdEvent.id,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const body = await req.json();
    const { bookingId, updateStatus = true }: { bookingId: string; updateStatus?: boolean } = body;

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'Missing bookingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Google API settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'google_api_settings')
      .single();

    if (settingsError || !settingsData?.value) {
      return new Response(
        JSON.stringify({ error: 'Google API not configured. Please add service account key in admin settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const googleSettings = settingsData.value as { serviceAccountKey: string; calendarId?: string };
    
    if (!googleSettings.serviceAccountKey) {
      return new Response(
        JSON.stringify({ error: 'Google service account key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let serviceAccount: ServiceAccountKey;
    try {
      serviceAccount = JSON.parse(googleSettings.serviceAccountKey);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid service account key format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get player info
    const { data: playerData } = await supabase
      .from('players')
      .select('full_name')
      .eq('user_id', booking.player_user_id)
      .single();

    const { data: playerPrivate } = await supabase
      .from('player_private')
      .select('email')
      .eq('user_id', booking.player_user_id)
      .single();

    // Get consultation settings for duration
    const { data: consultSettings } = await supabase
      .from('consultation_settings')
      .select('duration_minutes, description')
      .single();

    console.log('Creating Google Calendar event for booking:', bookingId);

    // Get access token
    const accessToken = await getAccessToken(serviceAccount);

    // Create calendar event with Meet link
    const { meetLink, eventId } = await createCalendarEvent(
      accessToken,
      {
        bookingId: booking.id,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        playerName: playerData?.full_name,
        playerEmail: playerPrivate?.email,
        durationMinutes: consultSettings?.duration_minutes || 30,
        description: consultSettings?.description || undefined,
      },
      googleSettings.calendarId || 'primary'
    );

    console.log('Created Meet link:', meetLink);

    // Update booking with meet link
    const updateData: Record<string, unknown> = {
      meet_link: meetLink,
    };

    // Only update status if updateStatus is true
    if (updateStatus) {
      updateData.status = 'confirmed';
      updateData.payment_status = 'paid';
      updateData.confirmed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('consultation_bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw updateError;
    }

    // Check if a log entry already exists for this booking
    const { data: existingLog } = await supabase
      .from('google_meet_logs')
      .select('id, regenerated_count')
      .eq('booking_id', bookingId)
      .single();

    if (existingLog) {
      // Update existing log (regeneration case)
      const { error: logUpdateError } = await supabase
        .from('google_meet_logs')
        .update({
          meet_link: meetLink,
          calendar_event_id: eventId,
          status: 'created',
          error_message: null,
          regenerated_count: (existingLog.regenerated_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLog.id);

      if (logUpdateError) {
        console.error('Error updating meet log:', logUpdateError);
      } else {
        console.log('Updated existing meet log for booking:', bookingId);
      }
    } else {
      // Create new log entry
      const { error: logError } = await supabase
        .from('google_meet_logs')
        .insert({
          booking_id: bookingId,
          meet_link: meetLink,
          calendar_event_id: eventId,
          status: 'created',
          player_user_id: booking.player_user_id,
          player_name: playerData?.full_name || null,
          booking_date: booking.booking_date,
          start_time: booking.start_time,
          end_time: booking.end_time,
        });

      if (logError) {
        console.error('Error creating meet log:', logError);
      } else {
        console.log('Created meet log for booking:', bookingId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        meetLink,
        eventId,
        message: 'تم إنشاء رابط الاجتماع بنجاح',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error creating Google Meet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create Google Meet link';

    // Log error if we have booking info
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.bookingId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check if log exists
        const { data: existingLog } = await supabase
          .from('google_meet_logs')
          .select('id')
          .eq('booking_id', body.bookingId)
          .single();

        if (existingLog) {
          await supabase
            .from('google_meet_logs')
            .update({
              status: 'error',
              error_message: errorMessage,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLog.id);
        }
      }
    } catch (logErr) {
      console.error('Error logging meet creation failure:', logErr);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
