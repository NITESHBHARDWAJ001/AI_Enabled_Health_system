import { z } from "zod";

export const createDiagnosisSchema = z.object({
  body: z.object({
    consultationId: z.string().min(1),
    conditionName: z.string().min(1),
    description: z.string().optional(),
    aiSuggested: z.boolean().optional(),
    isContagious: z.boolean().optional(),
    contagionCategory: z.string().optional(),
  }),
});
