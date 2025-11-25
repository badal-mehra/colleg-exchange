// src/utils/cloudinaryDelete.ts

export async function deleteFromCloudinary(url: string) {
  try {
    // Extract public ID from the Cloudinary URL
    // e.g., from https://res.cloudinary.com/.../avatars/user-id-12345.jpg 
    const parts = url.split("/");
    const fileName = parts[parts.length - 1];
    // We only need the file name without the extension
    const publicId = fileName.split(".")[0];

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

    // Cloudinary uses basic auth for the deletion API
    const auth = btoa(`${apiKey}:${apiSecret}`);

    const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;

    // The public_id must include the folder name (e.g., 'avatars/user-id-12345')
    const formData = new FormData();
    formData.append("public_id", `avatars/${publicId}`);

    await fetch(deleteUrl, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

  } catch (err) {
    // Log error but do not throw, so upload isn't broken if delete fails
    console.error("Cloudinary delete failed:", err);
  }
}
