import { z } from "zod";

export const createAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().min(1),
    hospitalId: z.string().optional(),
    scheduledAt: z.string().min(1),
    reason: z.string().optional(),
    patientId: z.string().optional(), // set by doctor/admin booking on behalf of a patient
  }),
});

export const updateAppointmentStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
  }),
});
