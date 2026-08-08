import { z } from "zod";

export const createHospitalSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    address: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    specialties: z.array(z.string()).optional(),
    facilities: z.array(z.string()).optional(),
  }),
});

export const updateHospitalSchema = createHospitalSchema;

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2),
  }),
});
