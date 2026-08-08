import { api } from "./client";
import type { MedicalDocument } from "@/types";

export async function uploadDocument(patientId: string, documentType: string, file: File) {
  const formData = new FormData();
  formData.append("patientId", patientId);
  formData.append("documentType", documentType);
  formData.append("file", file);
  const res = await api.post("/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data as MedicalDocument;
}

export async function listDocuments(patientId: string) {
  const res = await api.get(`/documents/patient/${patientId}`);
  return res.data.data as MedicalDocument[];
}
