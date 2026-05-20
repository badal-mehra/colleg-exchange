// src/utils/cloudinaryUpload.ts

const CLOUDINARY_SIGN_URL =
  "https://mtaeqtmcixlrudjsxcew.supabase.co/functions/v1/cloudinary-sign";

type CloudinaryFolder = "avatars" | "slider";

export async function uploadToCloudinary(
  file: File,
  folder: CloudinaryFolder = "avatars"
): Promise<string> {
  // ✅ 1️⃣ Get signature from Supabase Edge Function (with auth header)
  const sigRes = await fetch(`${CLOUDINARY_SIGN_URL}?folder=${folder}`, {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  });

  if (!sigRes.ok) {
    console.error("Signature Error:", await sigRes.text());
    throw new Error("Failed to get Cloudinary signature");
  }

  const { signature, timestamp, apiKey, cloudName } = await sigRes.json();

  // ✅ 2️⃣ Upload to Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || !data.secure_url) {
    console.error("Cloudinary Error:", data);
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url;
}
