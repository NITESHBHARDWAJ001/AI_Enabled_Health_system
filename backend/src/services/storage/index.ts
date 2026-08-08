import { isCloudinaryConfigured } from "../../config/env";
import { logger } from "../../config/logger";
import { cloudinaryProvider } from "./cloudinaryProvider";
import { localProvider } from "./localProvider";
import { UploadResult } from "./storageService";

export async function uploadFile(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult> {
  if (isCloudinaryConfigured) {
    try {
      return await cloudinaryProvider.upload(fileBuffer, originalName, mimeType);
    } catch (err) {
      logger.error({ err }, "Cloudinary upload failed, falling back to local storage");
    }
  }
  return localProvider.upload(fileBuffer, originalName, mimeType);
}
