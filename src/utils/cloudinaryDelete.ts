import { supabase } from "@/integrations/supabase/client";

export async function deleteFromCloudinary(url: string) {
  try {
    if (!url.startsWith("https://res.cloudinary.com")) return;

    const match = url.match(/upload\/v\d+\/(.+)\./);
    if (!match || !match[1]) return;

    const publicId = match[1];

    console.log("PUBLIC ID SENT:", publicId);

    // ✅ Get the current session token safely
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      console.error("No auth token found");
      return;
    }

    const res = await fetch(
      "https://mtaeqtmcixlrudjsxcew.supabase.co/functions/v1/cloudinary-delete",
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // ✅ FIXED
        },
        body: JSON.stringify({ public_id: publicId }),
      }
    );

    const dataRes = await res.json();
    console.log("DELETE RESPONSE:", dataRes);

  } catch (err) {
    console.error("Delete failed:", err);
  }
}
