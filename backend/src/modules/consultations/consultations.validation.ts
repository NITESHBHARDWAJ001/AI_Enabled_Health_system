import { z } from "zod";

export const createConsultationSchema = z.object({
  body: z.object({
    appointmentId: z.string().min(1),
    symptoms: z.any().optional(),
    observations: z.string().optional(),
  }),
});

export const updateConsultationSchema = z.object({
  body: z.object({
    symptoms: z.any().optional(),
    observations: z.string().optional(),
    doctorNotes: z.string().optional(),
    aiSummary: z.string().optional(),
    endConsultation: z.boolean().optional(),
  }),
});
