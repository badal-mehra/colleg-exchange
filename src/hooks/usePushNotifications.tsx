// export async function subscribeToPush(userId: string) {
//   const permission = await Notification.requestPermission();
//   if (permission !== "granted") return;

//   const reg = await navigator.serviceWorker.ready;

//   const sub = await reg.pushManager.subscribe({
//     userVisibleOnly: true,
//     applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
//   });

//   await fetch("/api/save-push", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       user_id: userId,
//       subscription: sub
//     })
//   });
// }
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export async function subscribeToPush(userId: string) {
  console.log("🔥 subscribeToPush CALLED", userId);

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("❌ Notification permission denied");
    return;
  }

  const reg = await navigator.serviceWorker.ready;
  // @ts-ignore - pushManager exists on ServiceWorkerRegistration in browsers with Push API support
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      import.meta.env.VITE_VAPID_PUBLIC_KEY
    ),
  });

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-push`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        subscription: sub,
      }),
    }
  );

  console.log("✅ save-push response", await res.text());
}
