import { z } from "zod";

export const createPrescriptionSchema = z.object({
  body: z.object({
    consultationId: z.string().min(1),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          medicineName: z.string().min(1),
          dosage: z.string().optional(),
          frequency: z.string().optional(),
          duration: z.string().optional(),
          instructions: z.string().optional(),
        })
      )
      .min(1, "At least one medicine is required"),
  }),
});
