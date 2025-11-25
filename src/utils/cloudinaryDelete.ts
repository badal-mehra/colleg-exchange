export async function deleteFromCloudinary(url: string) {
  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return;

    const pathWithVersion = url.substring(uploadIndex + 8);
    const parts = pathWithVersion.split("/");
    const withoutVersion = parts.slice(1);
    const path = withoutVersion.join("/");
    const publicId = path.replace(/\.[^/.]+$/, "");

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
