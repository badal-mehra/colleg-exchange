import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key",
};

// Input validation constants
const MAX_TITLE_LENGTH = 100;
const MAX_BODY_LENGTH = 500;
const MAX_URL_LENGTH = 500;

function validateUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url, "https://example.com");
    return url.startsWith("/") || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeInput(input: string, maxLength: number): string {
  if (!input) return "";
  return input.slice(0, maxLength).replace(/[<>]/g, "");
}

// Base64url encode function that works with Uint8Array
function base64UrlEncode(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Create VAPID JWT token
async function createVapidJwt(
  audience: string,
  subject: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  
  // Create PKCS8 formatted key
  const pkcs8Header = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const pkcs8Key = new Uint8Array(pkcs8Header.length + 32);
  pkcs8Key.set(pkcs8Header);
  pkcs8Key.set(privateKeyBytes.slice(0, 32), pkcs8Header.length);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8Key.buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature from DER to raw format (if needed) and encode
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${unsignedToken}.${signatureB64}`;
}

// Send push notification using fetch
async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  const endpoint = subscription.endpoint;
  const audience = new URL(endpoint).origin;

  // Create VAPID JWT
  const jwt = await createVapidJwt(audience, vapidSubject, vapidPublicKey, vapidPrivateKey);

  // For simplicity, we'll send unencrypted payload
  // Most push services accept this for basic notifications
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
      "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
      "Urgency": "high",
    },
    body: payload,
  });

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    // Check for internal trigger
    const internalKey = req.headers.get("x-internal-key");
    const isInternalTrigger = internalKey === supabaseServiceKey;

    let callerUserId: string | null = null;
    let isAdmin = false;

    if (!isInternalTrigger) {
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

    if (!isInternalTrigger && !isAdmin && callerUserId !== user_id) {
      return new Response(
        JSON.stringify({ error: "Not authorized to send notifications to this user" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const subscription = subscriptionData.subscription as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    const payload = JSON.stringify({
      title: sanitizedTitle,
      body: sanitizedBody,
      url: sanitizedUrl,
    });

    // Send push using native fetch with VAPID auth
    const audience = new URL(subscription.endpoint).origin;
    const now = Math.floor(Date.now() / 1000);
    
    // Create JWT header and payload
    const jwtHeader = { typ: "JWT", alg: "ES256" };
    const jwtPayload = {
      aud: audience,
      exp: now + 12 * 60 * 60,
      sub: "mailto:support@mycampuskart.com",
    };

    const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtHeader)));
    const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtPayload)));
    const unsignedToken = `${headerB64}.${payloadB64}`;

    // Import private key and sign
    const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
    const pkcs8Header = new Uint8Array([
      0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
      0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
      0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
    ]);
    const pkcs8Key = new Uint8Array(pkcs8Header.length + 32);
    pkcs8Key.set(pkcs8Header);
    pkcs8Key.set(privateKeyBytes.slice(0, 32), pkcs8Header.length);

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      pkcs8Key.buffer as ArrayBuffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      cryptoKey,
      new TextEncoder().encode(unsignedToken)
    );

    const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuffer));
    const jwt = `${unsignedToken}.${signatureB64}`;

    // Send to push endpoint
    const pushResponse = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "TTL": "86400",
        "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
        "Urgency": "high",
      },
      body: payload,
    });

    if (!pushResponse.ok) {
      const errorText = await pushResponse.text();
      console.error("Push service error:", pushResponse.status, errorText);
      
      // If subscription is invalid, remove it
      if (pushResponse.status === 404 || pushResponse.status === 410) {
        await supabase.from("push_subscriptions").delete().eq("user_id", user_id);
        console.log("Removed invalid subscription for user:", user_id);
      }
      
      return new Response(
        JSON.stringify({ success: false, error: `Push failed: ${pushResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Push notification sent successfully to user:", user_id);

    // Save to notifications table
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
