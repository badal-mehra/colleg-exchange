export async function subscribeToPush(userId: string) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VAPID_PUBLIC_KEY
  });

  await fetch("/api/save-push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      subscription: sub
    })
  });
}
