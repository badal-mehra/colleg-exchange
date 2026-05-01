import { supabase } from "@/integrations/supabase/client";

let cachedVapidPublicKey: string | null = null;
let subscriptionPromise: Promise<boolean> | null = null;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function getVapidPublicKey() {
  if (cachedVapidPublicKey) return cachedVapidPublicKey;

  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey) {
    cachedVapidPublicKey = envKey;
    return envKey;
  }

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-public-key`, {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load push public key: ${res.status}`);
  }

  const data = await res.json();
  if (!data.publicKey) {
    throw new Error("Push public key is missing");
  }

  const publicKey = data.publicKey as string;
  cachedVapidPublicKey = publicKey;
  return publicKey;
}

export async function subscribeToPush(userId?: string | null, options: { prompt?: boolean } = {}) {
  if (!userId || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return false;
  }

  if (subscriptionPromise) return subscriptionPromise;

  subscriptionPromise = (async () => {
    const shouldPrompt = options.prompt ?? true;
    const permission = Notification.permission === "default" && shouldPrompt
      ? await Notification.requestPermission()
      : Notification.permission;

    if (permission !== "granted") {
      return false;
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error("Cannot save push subscription without an active session");
    }

    const reg = await navigator.serviceWorker.ready;
    const vapidPublicKey = await getVapidPublicKey();
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        subscription: sub,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to save push subscription: ${text}`);
    }

    return true;
  })().finally(() => {
    subscriptionPromise = null;
  });

  return subscriptionPromise;
}
