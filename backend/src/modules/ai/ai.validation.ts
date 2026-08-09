import { z } from "zod";

export const startConversationSchema = z.object({
  body: z.object({
    patientId: z.string().optional(),
    type: z.enum(["PATIENT_ASSISTANT", "DOCTOR_ASSISTANT", "SYMPTOM_INTAKE"]),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1),
  }),
});

export const symptomAnalysisSchema = z.object({
  body: z.object({
    patientId: z.string().min(1),
    conversationId: z.string().optional(),
    freeText: z.string().optional(),
  }),
});

export const saveScreeningSchema = z.object({
  body: z.object({
    inputSnapshot: z.any(),
    output: z.any(),
  }),
});
