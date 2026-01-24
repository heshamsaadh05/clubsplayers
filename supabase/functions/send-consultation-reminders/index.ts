import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time and time 1 hour from now
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Format date for comparison
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    const oneHourTime = oneHourFromNow.toTimeString().slice(0, 5);

    console.log(`Checking for consultations between ${currentTime} and ${oneHourTime} on ${today}`);

    // Find confirmed consultations happening within the next hour that haven't received a reminder
    const { data: upcomingConsultations, error: fetchError } = await supabase
      .from('consultation_bookings')
      .select('id, player_user_id, booking_date, start_time, end_time, meet_link')
      .eq('status', 'confirmed')
      .eq('booking_date', today)
      .eq('reminder_sent', false)
      .gte('start_time', currentTime)
      .lte('start_time', oneHourTime);

    if (fetchError) {
      console.error('Error fetching consultations:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${upcomingConsultations?.length || 0} consultations needing reminders`);

    const notificationsSent: string[] = [];

    for (const consultation of upcomingConsultations || []) {
      // Create notification for the player
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: consultation.player_user_id,
          type: 'consultation_reminder',
          title: 'Consultation Reminder',
          title_ar: 'تذكير بموعد الاستشارة',
          message: `Your consultation is starting at ${consultation.start_time}. Don't forget to join!`,
          message_ar: `موعد استشارتك يبدأ الساعة ${consultation.start_time}. لا تنسَ الانضمام!`,
          metadata: {
            booking_id: consultation.id,
            meet_link: consultation.meet_link,
            start_time: consultation.start_time,
          },
        });

      if (notificationError) {
        console.error(`Error creating notification for booking ${consultation.id}:`, notificationError);
        continue;
      }

      // Mark the reminder as sent
      const { error: updateError } = await supabase
        .from('consultation_bookings')
        .update({ reminder_sent: true })
        .eq('id', consultation.id);

      if (updateError) {
        console.error(`Error updating reminder_sent for booking ${consultation.id}:`, updateError);
        continue;
      }

      notificationsSent.push(consultation.id);
      console.log(`Reminder sent for booking ${consultation.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${notificationsSent.length} reminders`,
        bookings: notificationsSent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error in send-consultation-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
