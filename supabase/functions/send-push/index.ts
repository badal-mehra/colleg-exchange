import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_TITLE_LENGTH = 100;
const MAX_BODY_LENGTH = 500;
const MAX_URL_LENGTH = 500;

function validateUrl(url: string): boolean {
  if (!url) return true; // Optional field
  try {
    const parsed = new URL(url, "https://example.com");
    // Only allow relative URLs or same-origin URLs
    return url.startsWith("/") || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeInput(input: string, maxLength: number): string {
  if (!input) return "";
  return input.slice(0, maxLength).replace(/[<>]/g, "");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    // Check for internal trigger (from database trigger via pg_net)
    const internalKey = req.headers.get("x-internal-key");
    const isInternalTrigger = internalKey === supabaseServiceKey;

    let callerUserId: string | null = null;
    let isAdmin = false;

    if (!isInternalTrigger) {
      // Verify authentication for external calls
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Authorization required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !user) {
        console.error("Auth error:", authError);
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      callerUserId = user.id;

      // Check if caller is admin
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
      const { data: adminCheck } = await supabaseService.rpc("is_admin", { user_id: user.id });
      isAdmin = adminCheck === true;
    }

    const { user_id, title, body, url } = await req.json();
    console.log("Send push request for user:", user_id);

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authorization check: only admins or internal triggers can send to any user
    // Non-admins can only send to themselves (for testing)
    if (!isInternalTrigger && !isAdmin && callerUserId !== user_id) {
      return new Response(
        JSON.stringify({ error: "Not authorized to send notifications to this user" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize input
    const sanitizedTitle = sanitizeInput(title || "MyCampusKart", MAX_TITLE_LENGTH);
    const sanitizedBody = sanitizeInput(body || "You have a new notification", MAX_BODY_LENGTH);
    const sanitizedUrl = url ? sanitizeInput(url, MAX_URL_LENGTH) : "/dashboard";

    if (!validateUrl(sanitizedUrl)) {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's push subscription
    const { data: subscriptionData, error: subError } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", user_id)
      .single();

    if (subError || !subscriptionData) {
      console.log("No subscription found for user:", user_id);
      return new Response(
        JSON.stringify({ success: false, reason: "No subscription found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subscription = subscriptionData.subscription;
    const payload = JSON.stringify({
      title: sanitizedTitle,
      body: sanitizedBody,
      url: sanitizedUrl,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });

    // Send push notification using web-push
    const webPush = await import("https://esm.sh/web-push@3.6.7");
    
    webPush.setVapidDetails(
      "mailto:support@mycampuskart.com",
      vapidPublicKey,
      vapidPrivateKey
    );

    await webPush.sendNotification(subscription, payload);
    console.log("✅ Push notification sent successfully to user:", user_id);

    // Also save to notifications table for history
    await supabase.from("notifications").insert({
      user_id,
      title: sanitizedTitle,
      body: sanitizedBody,
      url: sanitizedUrl,
      type: "push",
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending push:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
