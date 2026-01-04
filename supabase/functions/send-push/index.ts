import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push library for Deno
async function sendWebPush(subscription: any, payload: string, vapidKeys: { publicKey: string; privateKey: string }) {
  const encoder = new TextEncoder();
  
  // Import the web-push compatible library
  const webPush = await import("https://esm.sh/web-push@3.6.7");
  
  webPush.setVapidDetails(
    "mailto:support@mycampuskart.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  return await webPush.sendNotification(subscription, payload);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, url } = await req.json();
    console.log("Sending push notification to user:", user_id);
    console.log("Notification:", { title, body, url });

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      title: title || "MyCampusKart",
      body: body || "You have a new notification",
      url: url || "/dashboard",
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
    console.log("✅ Push notification sent successfully");

    // Also save to notifications table for history
    await supabase.from("notifications").insert({
      user_id,
      title,
      body,
      url,
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
