import { v2 as cloudinary } from "cloudinary";

const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string,
  resourceType: "image" | "raw" = "image"
) {
  if (!isConfigured) {
    throw new Error("Cloudinary not configured: missing CLOUDINARY_* env vars");
  }

  return new Promise<{ url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: resourceType,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(new Error(error.message || JSON.stringify(error)));
        resolve({ url: result!.secure_url, public_id: result!.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string) {
  if (!isConfigured) return;
  return cloudinary.uploader.destroy(publicId);
}
