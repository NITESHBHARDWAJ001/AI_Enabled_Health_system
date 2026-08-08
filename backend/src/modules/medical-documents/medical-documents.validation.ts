import { z } from "zod";

export const uploadDocumentSchema = z.object({
  body: z.object({
    patientId: z.string().min(1),
    documentType: z.enum([
      "PRESCRIPTION",
      "LAB_REPORT",
      "XRAY",
      "MRI",
      "CT",
      "DISCHARGE_SUMMARY",
      "OTHER",
    ]),
  }),
});
