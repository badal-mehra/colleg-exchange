// src/utils/cloudinaryUpload.ts

import { supabase } from "@/integrations/supabase/client";

const CLOUDINARY_SIGN_URL =
  "https://mtaeqtmcixlrudjsxcew.supabase.co/functions/v1/cloudinary-sign";

type CloudinaryFolder = "avatars" | "slider";

async function getFreshAccessToken(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (!session) {
    throw new Error("Please sign in to upload images.");
  }

  // If token is close to expiring, refresh it (prevents 401 "Invalid or expired token")
  const expiresAtMs = session?.expires_at ? session.expires_at * 1000 : null;
  const shouldRefresh =
    !session.access_token || (expiresAtMs !== null && expiresAtMs <= Date.now() + 30_000);

  if (!shouldRefresh) return session.access_token;

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  const freshToken = refreshed?.session?.access_token;

  if (refreshError || !freshToken) {
    // Clear any broken/stale session (common after "refresh token not found")
    await supabase.auth.signOut();
    throw new Error("Session expired. Please sign in again and retry.");
  }

  return freshToken;
}

async function readEdgeError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return typeof json?.error === "string" ? json.error : text;
  } catch {
    return text;
  }
}

export async function uploadToCloudinary(
  file: File,
  folder: CloudinaryFolder = "avatars"
): Promise<string> {
  const accessToken = await getFreshAccessToken();

  // Get signature from Supabase Edge Function with user's auth token
  const sigRes = await fetch(`${CLOUDINARY_SIGN_URL}?folder=${encodeURIComponent(folder)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!sigRes.ok) {
    const message = await readEdgeError(sigRes);
    // If our JWT is invalid/expired, force re-login rather than cascading failures.
    if (sigRes.status === 401) {
      await supabase.auth.signOut();
      throw new Error("Session expired. Please sign in again and retry.");
    }
    throw new Error(message || "Failed to get Cloudinary signature");
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

export function getSliderImageUrl(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;

  // Strip any existing transform already baked into the URL, then apply one
  // consistent 16:9 fill transform at render time.
  const clean = url.replace(/\/upload\/[^/]+\//, '/upload/');
  return clean.replace('/upload/', '/upload/c_fill,ar_16:9,g_auto,q_auto,f_auto,w_1280/');
}
