// src/utils/cloudinaryUpload.ts

import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/imageCompression";

const CLOUDINARY_SIGN_URL =
  "https://mtaeqtmcixlrudjsxcew.supabase.co/functions/v1/cloudinary-sign";

type CloudinaryFolder = "avatars" | "slider";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type UploadErrorCode =
  | "file_too_large"
  | "signature_failed"
  | "network_timeout"
  | "auth_expired"
  | "unknown";

export class UploadError extends Error {
  code: UploadErrorCode;
  constructor(code: UploadErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

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

export interface UploadOptions {
  onProgress?: (pct: number) => void;
}

export async function uploadToCloudinary(
  file: File,
  folder: CloudinaryFolder = "avatars",
  options: UploadOptions = {}
): Promise<string> {
  const { onProgress } = options;

  // 0) Pre-flight size check (catch obvious "file too large" before any work).
  if (file.size > FILE_SIZE_LIMIT) {
    throw new UploadError(
      "file_too_large",
      `Image is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 5MB.`
    );
  }

  // 1) Compress before upload to reduce timeouts on flaky mobile networks.
  let prepared: File | Blob;
  try {
    prepared = await compressImage(file, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.82,
    });
  } catch {
    prepared = file;
  }
  onProgress?.(15);

  // 2) Auth + signature
  let accessToken: string;
  try {
    accessToken = await getFreshAccessToken();
  } catch (e: any) {
    throw new UploadError("auth_expired", e?.message || "Session expired. Please sign in again.");
  }

  let sigRes: Response;
  try {
    sigRes = await fetchWithRetry(
      `${CLOUDINARY_SIGN_URL}?folder=${encodeURIComponent(folder)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
      2
    );
  } catch {
    throw new UploadError(
      "signature_failed",
      "Couldn't reach upload server. Check your connection and retry."
    );
  }

  if (!sigRes.ok) {
    const message = await readEdgeError(sigRes);
    if (sigRes.status === 401) {
      await supabase.auth.signOut();
      throw new UploadError("auth_expired", "Session expired. Please sign in again.");
    }
    throw new UploadError("signature_failed", message || "Failed to get upload signature");
  }

  const { signature, timestamp, apiKey, cloudName } = await sigRes.json();
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  onProgress?.(30);

  // 3) Upload to Cloudinary using XHR so we get real progress events.
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await xhrUpload(uploadUrl, {
        file: prepared,
        apiKey,
        timestamp,
        signature,
        folder,
        onProgress: (pct) => onProgress?.(30 + Math.round(pct * 0.7)),
      });
      if (result?.secure_url) return result.secure_url;
      lastError = new Error("Upload completed but no URL returned");
    } catch (err: any) {
      // Don't retry on validation/auth errors
      if (err?.status && err.status >= 400 && err.status < 500) {
        if (err.status === 413) {
          throw new UploadError("file_too_large", "Image is too large for the server.");
        }
        throw new UploadError("unknown", err?.message || "Upload rejected by server.");
      }
      lastError = err;
    }
    await sleep(600 * (attempt + 1));
  }
  throw new UploadError(
    "network_timeout",
    lastError?.message
      ? `Network timeout: ${lastError.message}`
      : "Network timeout. Check your internet connection and try again."
  );
}

interface XhrUploadParams {
  file: Blob;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  onProgress?: (pct: number) => void;
}

function xhrUpload(url: string, params: XhrUploadParams): Promise<any> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("api_key", params.apiKey);
    formData.append("timestamp", String(params.timestamp));
    formData.append("signature", params.signature);
    formData.append("folder", params.folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 60_000; // 60s per attempt

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && params.onProgress) {
        params.onProgress(Math.min(100, (e.loaded / e.total) * 100));
      }
    };
    xhr.ontimeout = () => {
      const err: any = new Error("Upload timed out");
      err.status = 0;
      reject(err);
    };
    xhr.onerror = () => {
      const err: any = new Error("Network error during upload");
      err.status = 0;
      reject(err);
    };
    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        const err: any = new Error(data?.error?.message || `Upload failed (${xhr.status})`);
        err.status = xhr.status;
        reject(err);
      }
    };
    xhr.send(formData);
  });
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
