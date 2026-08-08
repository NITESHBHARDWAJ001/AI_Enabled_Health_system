import { v2 as cloudinary } from "cloudinary";
import { StorageProvider } from "@prisma/client";
import { env, isCloudinaryConfigured } from "../../config/env";
import { StorageBackend, UploadResult } from "./storageService";

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export const cloudinaryProvider: StorageBackend = {
  async upload(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult> {
    const isImage = mimeType.startsWith("image/");
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "hop/medical-documents",
          resource_type: isImage ? "image" : "raw",
          public_id: originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_"),
        },
        (error, res) => (error ? reject(error) : resolve(res))
      );
      stream.end(fileBuffer);
    });

    return { url: result.secure_url as string, provider: StorageProvider.CLOUDINARY };
  },
};
