import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google OAuth2 token URL
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Create JWT for Google Service Account
async function createJWT(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: serviceAccount.private_key_id
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  
  // Base64URL encode
  const base64UrlEncode = (data: Uint8Array): string => {
    const base64 = btoa(String.fromCharCode(...data));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signInput = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signInput)
  );

  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${signInput}.${signatureB64}`;
}

// Get access token from Google
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await createJWT(serviceAccount);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Token error:", data);
    throw new Error(data.error_description || data.error || "Failed to get access token");
  }

  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Testing Google API connection...");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the service account key from settings or request body
    let serviceAccountKey: string | null = null;
    
    const body = await req.json().catch(() => ({}));
    
    if (body.service_account_key) {
      // Test with provided key (before saving)
      serviceAccountKey = body.service_account_key;
    } else {
      // Test with saved key
      const { data: settingData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "google_api_settings")
        .single();

      if (settingData?.value) {
        const settings = settingData.value as { service_account_key?: string };
        serviceAccountKey = settings.service_account_key || null;
      }
    }

    if (!serviceAccountKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "لم يتم تكوين مفتاح Google API",
          error_code: "NO_KEY"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate the service account key
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "صيغة مفتاح الخدمة غير صالحة - يجب أن يكون JSON صالح",
          error_code: "INVALID_JSON"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const requiredFields = ["type", "project_id", "private_key_id", "private_key", "client_email"];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `حقول مفقودة في مفتاح الخدمة: ${missingFields.join(", ")}`,
          error_code: "MISSING_FIELDS"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (serviceAccount.type !== "service_account") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "نوع المفتاح غير صحيح - يجب أن يكون 'service_account'",
          error_code: "INVALID_TYPE"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to get an access token - this validates the key with Google
    console.log("Attempting to get access token from Google...");
    const accessToken = await getAccessToken(serviceAccount);

    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "فشل في الحصول على رمز الوصول من Google",
          error_code: "TOKEN_FAILED"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test API access by listing calendars
    console.log("Testing Calendar API access...");
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const calendarData = await calendarResponse.json();

    if (!calendarResponse.ok) {
      console.error("Calendar API error:", calendarData);
      
      if (calendarData.error?.code === 403) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "لم يتم تفعيل Google Calendar API في مشروع Google Cloud. يرجى تفعيلها من API Library.",
            error_code: "API_NOT_ENABLED"
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: calendarData.error?.message || "فشل في الوصول إلى Google Calendar API",
          error_code: "API_ERROR"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Google API test successful!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم التحقق من اتصال Google API بنجاح!",
        details: {
          project_id: serviceAccount.project_id,
          client_email: serviceAccount.client_email,
          calendars_accessible: true
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error testing Google API:", error);
    
    let errorMessage = "حدث خطأ أثناء اختبار الاتصال";
    let errorCode = "UNKNOWN_ERROR";

    if (error instanceof Error) {
      if (error.message.includes("private key")) {
        errorMessage = "المفتاح الخاص غير صالح أو تالف";
        errorCode = "INVALID_PRIVATE_KEY";
      } else if (error.message.includes("invalid_grant")) {
        errorMessage = "صلاحيات حساب الخدمة غير صحيحة";
        errorCode = "INVALID_GRANT";
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage, error_code: errorCode }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
