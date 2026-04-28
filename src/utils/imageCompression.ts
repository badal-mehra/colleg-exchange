// Lightweight client-side image compressor.
// Reduces file size before upload to drastically cut "Failed to fetch" errors
// caused by large photos on slow mobile networks.

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  mimeType?: string;
}

export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = opts;

  // Skip non-images and tiny files (already small enough)
  if (!file.type.startsWith('image/')) return file;
  if (file.size < 400 * 1024) return file;

  try {
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);

    let { width, height } = img;
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), mimeType, quality)
    );
    if (!blob) return file;

    // Only return the compressed copy if it's actually smaller.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, '') + '.jpg';
    return new File([blob], newName, { type: mimeType, lastModified: Date.now() });
  } catch (e) {
    console.warn('Image compression failed, using original file:', e);
    return file;
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
