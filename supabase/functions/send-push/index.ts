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

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    output.set(arr, offset);
    offset += arr.length;
  }
  return output;
}

async function hmacSha256(keyData: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  return hmacSha256(salt, ikm);
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const blocks: Uint8Array[] = [];
  let previous = new Uint8Array(0);
  let counter = 1;

  while (concatUint8Arrays(...blocks).length < length) {
    previous = await hmacSha256(
      prk,
      concatUint8Arrays(previous, info, new Uint8Array([counter]))
    );
    blocks.push(previous);
    counter += 1;
  }

  return concatUint8Arrays(...blocks).slice(0, length);
}

async function encryptPushPayload(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const receiverPublicKeyBytes = base64UrlToUint8Array(subscription.keys.p256dh);
  const receiverPublicKey = await crypto.subtle.importKey(
    "raw",
    receiverPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const senderKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const senderPublicKey = new Uint8Array(await crypto.subtle.exportKey("raw", senderKeys.publicKey));
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: receiverPublicKey },
      senderKeys.privateKey,
      256
    )
  );

  const authSecret = base64UrlToUint8Array(subscription.keys.auth);
  const keyInfo = concatUint8Arrays(
    encoder.encode("WebPush: info\0"),
    receiverPublicKeyBytes,
    senderPublicKey
  );
  const prkKey = await hkdfExtract(authSecret, sharedSecret);
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdfExtract(salt, ikm);
  const cek = await hkdfExpand(prk, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfExpand(prk, encoder.encode("Content-Encoding: nonce\0"), 12);
  const plaintext = concatUint8Arrays(encoder.encode(payload), new Uint8Array([2]));

  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, plaintext)
  );

  return concatUint8Arrays(
    salt,
    new Uint8Array([0, 0, 16, 0]),
    new Uint8Array([senderPublicKey.length]),
    senderPublicKey,
    ciphertext
  );
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

  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);
  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 4) {
    throw new Error("Invalid VAPID public key format");
  }

  // VAPID private keys are stored as raw base64url `d` values, not PKCS8.
  // Importing via JWK avoids InvalidEncoding errors in Supabase Edge Runtime.
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: vapidPrivateKey,
      x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
      y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
      ext: true,
    },
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

    const { user_id, title, body, url, skip_insert } = await req.json();
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

    // Save in-app notification unless caller already inserted it (e.g. admin broadcast)
    if (!skip_insert) {
      await supabase.from("notifications").insert({
        user_id,
        title: sanitizedTitle,
        body: sanitizedBody,
        url: sanitizedUrl,
        type: "push",
      });
    }

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

    const audience = new URL(subscription.endpoint).origin;
    const jwt = await createVapidJwt(
      audience,
      "mailto:support@mycampuskart.com",
      vapidPublicKey,
      vapidPrivateKey
    );

    const encryptedPayload = await encryptPushPayload(subscription, payload);

    // Send encrypted payload to push endpoint
    const pushResponse = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400",
        "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
        "Urgency": "high",
      },
      body: encryptedPayload,
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
