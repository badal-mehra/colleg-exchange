import { supabase } from "@/integrations/supabase/client";

export async function deleteFromCloudinary(url: string) {
  try {
    if (!url.startsWith("https://res.cloudinary.com")) return;

    const match = url.match(/upload\/v\d+\/(.+)\./);
    if (!match || !match[1]) return;

    const publicId = match[1];

    console.log("PUBLIC ID SENT:", publicId);

    const token = (await supabase.auth.getSession()).data.session?.access_token;

    const res = await fetch(
      "https://mtaeqtmcixlrudjsxcew.supabase.co/functions/v1/cloudinary-delete",
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ public_id: publicId }),
      }
    );

    const data = await res.json();
    console.log("DELETE RESPONSE:", data);

  } catch (err) {
    console.error("Delete failed:", err);
  }
}
