import { z } from "zod";

export const updatePatientSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    dob: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    phone: z.string().optional(),
    bloodGroup: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
  }),
});

export const listPatientsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
  }),
});

export const createVitalSchema = z.object({
  body: z.object({
    type: z.enum([
      "BLOOD_PRESSURE",
      "HEART_RATE",
      "TEMPERATURE",
      "WEIGHT",
      "HEIGHT",
      "GLUCOSE",
      "SPO2",
      "RESPIRATORY_RATE",
    ]),
    value: z.number(),
    unit: z.string().min(1),
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

export const createConditionSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    status: z.enum(["ACTIVE", "RESOLVED", "MANAGED"]).optional(),
    diagnosedAt: z.string().optional(),
    notes: z.string().optional(),
  }),
});
