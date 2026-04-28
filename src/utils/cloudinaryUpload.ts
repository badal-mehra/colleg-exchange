// src/utils/cloudinaryUpload.ts

import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/imageCompression";

const CLOUDINARY_SIGN_URL =
  "https://mtaeqtmcixlrudjsxcew.supabase.co/functions/v1/cloudinary-sign";

type CloudinaryFolder = "avatars" | "slider";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  // 1) Compress before upload to reduce timeouts on flaky mobile networks.
  const prepared = await compressImage(file, {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.82,
  });

  const accessToken = await getFreshAccessToken();

  // 2) Get signature with light retry (Edge Function cold-starts can flake).
  const sigRes = await fetchWithRetry(
    `${CLOUDINARY_SIGN_URL}?folder=${encodeURIComponent(folder)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
    2
  );

  if (!sigRes.ok) {
    const message = await readEdgeError(sigRes);
    if (sigRes.status === 401) {
      await supabase.auth.signOut();
      throw new Error("Session expired. Please sign in again and retry.");
    }
    throw new Error(message || "Failed to get Cloudinary signature");
  }

  const { signature, timestamp, apiKey, cloudName } = await sigRes.json();

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  // 3) Upload to Cloudinary with retry on network errors / 5xx.
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const formData = new FormData();
      formData.append("file", prepared);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.secure_url) return data.secure_url;

      // Don't retry on auth/validation errors
      if (res.status >= 400 && res.status < 500) {
        console.error("Cloudinary Error:", data);
        throw new Error(data?.error?.message || "Cloudinary upload failed");
      }
      lastError = new Error(data?.error?.message || `Upload failed (${res.status})`);
    } catch (err: any) {
      lastError = err;
    }
    await sleep(600 * (attempt + 1));
  }
  throw new Error(
    lastError?.message
      ? `Upload failed after retries: ${lastError.message}`
      : "Upload failed. Please check your internet connection and try again."
  );
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries: number
): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || (res.status >= 400 && res.status < 500)) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    if (i < retries) await sleep(500 * (i + 1));
  }
  throw lastErr ?? new Error("Network error");
}

export function getSliderImageUrl(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;

  // Strip any existing transform already baked into the URL, then apply one
  // consistent 16:9 fill transform at render time.
  const clean = url.replace(/\/upload\/[^/]+\//, '/upload/');
  return clean.replace('/upload/', '/upload/c_fill,ar_16:9,g_auto,q_auto,f_auto,w_1280/');
}
