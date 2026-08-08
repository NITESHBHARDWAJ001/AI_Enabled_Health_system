import fs from "fs";
import path from "path";
import crypto from "crypto";
import { StorageProvider } from "@prisma/client";
import { env } from "../../config/env";
import { StorageBackend, UploadResult } from "./storageService";

const uploadRoot = path.join(process.cwd(), env.uploadDir);
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

export const localProvider: StorageBackend = {
  async upload(fileBuffer: Buffer, originalName: string, _mimeType: string): Promise<UploadResult> {
    const ext = path.extname(originalName);
    const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${safeBase}-${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadRoot, fileName);

    await fs.promises.writeFile(filePath, fileBuffer);

    return { url: `/uploads/${fileName}`, provider: StorageProvider.LOCAL };
  },
};
