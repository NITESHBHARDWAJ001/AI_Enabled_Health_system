import { StorageProvider } from "@prisma/client";

export interface UploadResult {
  url: string;
  provider: StorageProvider;
}

export interface StorageBackend {
  upload(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult>;
}
