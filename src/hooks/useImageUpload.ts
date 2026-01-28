import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary } from '@/utils/cloudinaryUpload';
import { deleteFromCloudinary } from '@/utils/cloudinaryDelete';

export interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface UploadedImage {
  id: string;
  url: string;
}

/**
 * Hook for handling image uploads with deferred Cloudinary upload.
 * Images are stored locally as previews until explicitly uploaded.
 */
export function useImageUpload(maxImages: number = 5) {
  const { toast } = useToast();
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploading, setUploading] = useState(false);

  /**
   * Add files as local previews (no Cloudinary upload yet)
   */
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

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Image too large',
          description: `"${file.name}" exceeds 5MB limit`,
          variant: 'destructive',
        });
        continue;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `"${file.name}" is not an image`,
          variant: 'destructive',
        });
        continue;
      }

      newImages.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (newImages.length > 0) {
      setLocalImages(prev => [...prev, ...newImages]);
    }
  }, [localImages.length, maxImages, toast]);

  /**
   * Remove a local preview image (revokes object URL to prevent memory leaks)
   */
  const removeLocalImage = useCallback((id: string) => {
    setLocalImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  /**
   * Upload all local images to Cloudinary
   * Returns array of uploaded URLs or null if any upload fails
   */
  const uploadAllImages = useCallback(async (): Promise<string[] | null> => {
    if (localImages.length === 0) {
      return [];
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const localImage of localImages) {
        const url = await uploadToCloudinary(localImage.file, 'slider');
        // Optimize the URL
        const optimizedUrl = url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
        uploadedUrls.push(optimizedUrl);
      }

      // Clean up local previews after successful upload
      localImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setLocalImages([]);
      
      return uploadedUrls;
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload images',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [localImages, toast]);

  /**
   * Clear all local images without uploading
   */
  const clearAllImages = useCallback(() => {
    localImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setLocalImages([]);
  }, [localImages]);

  /**
   * Get preview URLs for display
   */
  const previewUrls = localImages.map(img => img.previewUrl);

  return {
    localImages,
    previewUrls,
    uploading,
    addImages,
    removeLocalImage,
    uploadAllImages,
    clearAllImages,
    imageCount: localImages.length,
    canAddMore: localImages.length < maxImages,
  };
}

/**
 * Delete images from Cloudinary when removing from an existing listing
 */
export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  const deletePromises = urls.map(url => deleteFromCloudinary(url));
  await Promise.all(deletePromises);
}
