import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary, UploadError, UploadErrorCode } from '@/utils/cloudinaryUpload';
import { deleteFromCloudinary } from '@/utils/cloudinaryDelete';

export type UploadStatus = 'queued' | 'uploading' | 'success' | 'failed';

export interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number; // 0-100
  errorCode?: UploadErrorCode;
  errorMessage?: string;
  uploadedUrl?: string;
}

const FILE_LIMIT_BYTES = 5 * 1024 * 1024;

function friendlyError(code: UploadErrorCode | undefined, fallback: string): string {
  switch (code) {
    case 'file_too_large':
      return 'File too large (max 5MB)';
    case 'signature_failed':
      return 'Signature fetch failed — retry';
    case 'network_timeout':
      return 'Network timeout — check connection';
    case 'auth_expired':
      return 'Session expired — sign in again';
    default:
      return fallback || 'Upload failed';
  }
}

export function useImageUpload(maxImages: number = 5) {
  const { toast } = useToast();
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const addImages = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImages: LocalImage[] = [];

    for (const file of fileArray) {
      if (localImages.length + newImages.length >= maxImages) {
        toast({
          title: 'Maximum images reached',
          description: `You can only upload up to ${maxImages} images`,
          variant: 'destructive',
        });
        break;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `"${file.name}" is not an image`,
          variant: 'destructive',
        });
        continue;
      }

      const tooLarge = file.size > FILE_LIMIT_BYTES;
      newImages.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: tooLarge ? 'failed' : 'queued',
        progress: 0,
        errorCode: tooLarge ? 'file_too_large' : undefined,
        errorMessage: tooLarge ? 'File too large (max 5MB)' : undefined,
      });
    }

    if (newImages.length > 0) {
      setLocalImages((prev) => [...prev, ...newImages]);
    }
  }, [localImages.length, maxImages, toast]);

  const removeLocalImage = useCallback((id: string) => {
    setLocalImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const updateImage = useCallback((id: string, patch: Partial<LocalImage>) => {
    setLocalImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  }, []);

  /**
   * Upload one image (used internally and for retries).
   */
  const uploadOne = useCallback(async (img: LocalImage): Promise<string | null> => {
    updateImage(img.id, { status: 'uploading', progress: 0, errorCode: undefined, errorMessage: undefined });
    try {
      const url = await uploadToCloudinary(img.file, 'slider', {
        onProgress: (pct) => updateImage(img.id, { progress: pct }),
      });
      updateImage(img.id, { status: 'success', progress: 100, uploadedUrl: url });
      return url;
    } catch (e: any) {
      const code: UploadErrorCode | undefined = e instanceof UploadError ? e.code : 'unknown';
      const message = friendlyError(code, e?.message);
      updateImage(img.id, { status: 'failed', errorCode: code, errorMessage: message });
      return null;
    }
  }, [updateImage]);

  /**
   * Retry a single failed image.
   */
  const retryImage = useCallback(async (id: string) => {
    const img = localImages.find((i) => i.id === id);
    if (!img) return;
    if (img.errorCode === 'file_too_large') {
      toast({
        title: 'File too large',
        description: 'Pick a smaller image (under 5MB).',
        variant: 'destructive',
      });
      return;
    }
    await uploadOne(img);
  }, [localImages, uploadOne, toast]);

  /**
   * Upload all queued/failed images. Returns array of URLs (in order) or null
   * if any image is still failed at the end.
   */
  const uploadAllImages = useCallback(async (): Promise<string[] | null> => {
    if (localImages.length === 0) return [];

    setUploading(true);
    try {
      // Snapshot of work to do, in current order
      const snapshot = localImages.map((i) => ({ ...i }));
      const urls: (string | null)[] = snapshot.map((i) => i.uploadedUrl ?? null);

      for (let idx = 0; idx < snapshot.length; idx++) {
        const img = snapshot[idx];
        if (img.status === 'success' && img.uploadedUrl) {
          urls[idx] = img.uploadedUrl;
          continue;
        }
        if (img.errorCode === 'file_too_large') {
          urls[idx] = null;
          continue;
        }
        const url = await uploadOne(img);
        urls[idx] = url;
      }

      if (urls.some((u) => !u)) {
        toast({
          title: 'Some images failed',
          description: 'Tap a failed image to retry, or remove it and continue.',
          variant: 'destructive',
        });
        return null;
      }

      const finalUrls = urls.filter((u): u is string => !!u);
      // Cleanup previews on full success
      localImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setLocalImages([]);
      return finalUrls;
    } finally {
      setUploading(false);
    }
  }, [localImages, uploadOne, toast]);

  const clearAllImages = useCallback(() => {
    localImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setLocalImages([]);
  }, [localImages]);

  const previewUrls = localImages.map((img) => img.previewUrl);

  return {
    localImages,
    previewUrls,
    uploading,
    addImages,
    removeLocalImage,
    retryImage,
    uploadAllImages,
    clearAllImages,
    imageCount: localImages.length,
    canAddMore: localImages.length < maxImages,
  };
}

export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  const deletePromises = urls.map((url) => deleteFromCloudinary(url));
  await Promise.all(deletePromises);
}
