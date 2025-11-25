// src/utils/cloudinaryDelete.ts

export async function deleteFromCloudinary(url: string) {
  try {
    // Extract everything AFTER /upload/
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) {
        console.warn("URL does not contain '/upload/' segment, skipping deletion:", url);
        return;
    }

    // Skip "/upload/" (8 characters)
    const pathWithVersion = url.substring(uploadIndex + 8); 
    const parts = pathWithVersion.split("/");

    // The first part is usually the version number (e.g., v1738348234). Remove it.
    const withoutVersion = parts.slice(1);

    // Join remaining parts to get the path (folder/filename.ext)
    const path = withoutVersion.join("/");

    // Remove file extension (e.g., .jpg, .png, .webp)
    // The public ID is the full path minus the extension.
    const publicId = path.replace(/\.[^/.]+$/, ""); 

    if (!publicId) {
        console.error("Failed to extract publicId from URL:", url);
        return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

    // Use Basic Authentication
    const auth = btoa(`${apiKey}:${apiSecret}`);

    const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;

    const formData = new FormData();
    // ✅ Use the correct full path (e.g., "avatars/userid-12345")
    formData.append("public_id", publicId); 

    await fetch(deleteUrl, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    
    console.log(`Successfully triggered Cloudinary deletion for public ID: ${publicId}`);

  } catch (err) {
    console.error("Cloudinary delete failed:", err);
  }
}
