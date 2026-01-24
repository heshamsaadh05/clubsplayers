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
      .select('id, player_user_id, booking_date, start_time, end_time, meet_link, admin_reminder_sent, reminder_sent')
      .eq('status', 'confirmed')
      .eq('booking_date', today)
      .gte('start_time', currentTime)
      .lte('start_time', oneHourTime);

    if (fetchError) {
      console.error('Error fetching consultations:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${upcomingConsultations?.length || 0} consultations to check for reminders`);

    // Get all admin user IDs
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
    }

    const adminUserIds = adminUsers?.map(a => a.user_id) || [];
    console.log(`Found ${adminUserIds.length} admin users`);

    const playerNotificationsSent: string[] = [];
    const adminNotificationsSent: string[] = [];

    for (const consultation of upcomingConsultations || []) {
      // Get player name for admin notification
      const { data: playerData } = await supabase
        .from('players')
        .select('full_name')
        .eq('user_id', consultation.player_user_id)
        .single();

      const playerName = playerData?.full_name || 'لاعب';

      // Send player reminder if not sent yet
      if (!consultation.reminder_sent) {
        const { error: playerNotificationError } = await supabase
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

        if (playerNotificationError) {
          console.error(`Error creating player notification for booking ${consultation.id}:`, playerNotificationError);
        } else {
          playerNotificationsSent.push(consultation.id);
          console.log(`Player reminder sent for booking ${consultation.id}`);
        }
      }

      // Send admin reminders if not sent yet
      if (!consultation.admin_reminder_sent && adminUserIds.length > 0) {
        for (const adminUserId of adminUserIds) {
          const { error: adminNotificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: adminUserId,
              type: 'admin_consultation_reminder',
              title: 'Upcoming Consultation',
              title_ar: 'استشارة قادمة',
              message: `Consultation with ${playerName} is starting at ${consultation.start_time}. Get ready!`,
              message_ar: `استشارة مع ${playerName} تبدأ الساعة ${consultation.start_time}. استعد!`,
              metadata: {
                booking_id: consultation.id,
                meet_link: consultation.meet_link,
                start_time: consultation.start_time,
                player_name: playerName,
              },
            });

          if (adminNotificationError) {
            console.error(`Error creating admin notification for booking ${consultation.id}:`, adminNotificationError);
          }
        }
        adminNotificationsSent.push(consultation.id);
        console.log(`Admin reminders sent for booking ${consultation.id}`);
      }

      // Update reminder flags
      const updateData: { reminder_sent?: boolean; admin_reminder_sent?: boolean } = {};
      if (!consultation.reminder_sent) {
        updateData.reminder_sent = true;
      }
      if (!consultation.admin_reminder_sent) {
        updateData.admin_reminder_sent = true;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('consultation_bookings')
          .update(updateData)
          .eq('id', consultation.id);

        if (updateError) {
          console.error(`Error updating reminder flags for booking ${consultation.id}:`, updateError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${playerNotificationsSent.length} player reminders and ${adminNotificationsSent.length} admin reminders`,
        playerReminders: playerNotificationsSent,
        adminReminders: adminNotificationsSent,
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
