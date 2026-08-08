import { DocumentType, Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../middleware/auth";
import { uploadFile } from "../../services/storage";

export async function uploadDocument(
  requester: AuthUser,
  input: { patientId: string; documentType: DocumentType },
  file: { buffer: Buffer; originalname: string; mimetype: string }
) {
  if (requester.role === Role.PATIENT && requester.patientId !== input.patientId) {
    throw ApiError.forbidden("You can only upload documents to your own record");
  }

  const { url, provider } = await uploadFile(file.buffer, file.originalname, file.mimetype);

  return prisma.medicalDocument.create({
    data: {
      patientId: input.patientId,
      documentType: input.documentType,
      fileUrl: url,
      fileName: file.originalname,
      mimeType: file.mimetype,
      storageProvider: provider,
      uploadedById: requester.id,
    },
  });
}

export async function listDocuments(requester: AuthUser, patientId: string) {
  if (requester.role === Role.PATIENT && requester.patientId !== patientId) throw ApiError.forbidden();
  return prisma.medicalDocument.findMany({ where: { patientId }, orderBy: { uploadedAt: "desc" } });
}
