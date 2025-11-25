export async function deleteFromCloudinary(url: string) {
  try {
    if (!url.startsWith("https://res.cloudinary.com")) return;

    // ✅ Extract public_id correctly
    const match = url.match(/upload\/v\d+\/(.+)\./);
    if (!match || !match[1]) return;

    const publicId = match[1]; // ✅ Example: avatars/abc123

    console.log("PUBLIC ID SENT:", publicId);

    // ✅ Call Supabase Edge Function
    const res = await fetch(
      "https://mtaeqtmcixlrudjsxcew.supabase.co/functions/v1/cloudinary-delete",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: publicId }),
      }
    );

    const data = await res.json();
    console.log("DELETE RESPONSE:", data);

  } catch (err) {
    console.error("Delete failed:", err);
  }
}
