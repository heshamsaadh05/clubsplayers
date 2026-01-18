import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization - only allow calls with service role key (strict Bearer token validation)
    const authHeader = req.headers.get("Authorization");
    const expectedServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Strict Bearer token validation - no loose includes() check
    const isAuthorized = authHeader && expectedServiceKey && 
      authHeader === `Bearer ${expectedServiceKey}`;
    
    if (!isAuthorized) {
      console.error("Unauthorized access attempt to auto-renew function", {
        timestamp: new Date().toISOString(),
        hasAuthHeader: !!authHeader,
      });
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find subscriptions that are:
    // 1. Active
    // 2. Auto-renew enabled
    // 3. Ending within the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const now = new Date();

    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*, subscription_plans(*)")
      .eq("status", "active")
      .eq("auto_renew", true)
      .lte("end_date", tomorrow.toISOString())
      .gte("end_date", now.toISOString());

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${expiringSubscriptions?.length || 0} subscriptions to renew`);

    const results = [];

    for (const subscription of expiringSubscriptions || []) {
      try {
        const plan = subscription.subscription_plans;
        if (!plan) {
          console.error(`No plan found for subscription ${subscription.id}`);
          continue;
        }

        const oldEndDate = new Date(subscription.end_date);
        const newEndDate = new Date(oldEndDate);
        newEndDate.setDate(newEndDate.getDate() + plan.duration_days);

        // Update subscription with new end date
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            end_date: newEndDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);

        if (updateError) {
          throw updateError;
        }

        // Log the renewal
        await supabase.from("renewal_logs").insert({
          subscription_id: subscription.id,
          old_end_date: oldEndDate.toISOString(),
          new_end_date: newEndDate.toISOString(),
          status: "success",
        });

        results.push({
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          status: "renewed",
          new_end_date: newEndDate.toISOString(),
        });

        console.log(`Renewed subscription ${subscription.id} until ${newEndDate.toISOString()}`);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error renewing subscription ${subscription.id}:`, errorMessage);
        
        // Log the failed renewal
        await supabase.from("renewal_logs").insert({
          subscription_id: subscription.id,
          old_end_date: subscription.end_date,
          new_end_date: subscription.end_date,
          status: "failed",
          error_message: errorMessage,
        });

        results.push({
          subscription_id: subscription.id,
          status: "failed",
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in auto-renew function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
