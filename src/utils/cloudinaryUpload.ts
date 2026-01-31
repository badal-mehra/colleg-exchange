// src/utils/cloudinaryUpload.ts

import { supabase } from "@/integrations/supabase/client";

const CLOUDINARY_SIGN_URL =
  "https://mtaeqtmcixlrudjsxcew.supabase.co/functions/v1/cloudinary-sign";

type CloudinaryFolder = "avatars" | "slider";

export async function uploadToCloudinary(
  file: File,
  folder: CloudinaryFolder = "avatars"
): Promise<string> {
  // Get the current user's session token
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error("User must be logged in to upload images");
  }

  // Get signature from Supabase Edge Function with user's auth token
  const sigRes = await fetch(`${CLOUDINARY_SIGN_URL}?folder=${folder}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!sigRes.ok) {
    console.error("Signature Error:", await sigRes.text());
    throw new Error("Failed to get Cloudinary signature");
  }

  const { signature, timestamp, apiKey, cloudName } = await sigRes.json();

  // Upload to Cloudinary
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
