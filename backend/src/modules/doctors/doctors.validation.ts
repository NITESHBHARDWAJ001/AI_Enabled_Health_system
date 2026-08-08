import { z } from "zod";

export const createDoctorSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    specialty: z.string().min(2),
    hospitalId: z.string().min(1),
    qualification: z.string().optional(),
    experienceYears: z.number().int().nonnegative().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    consultationFee: z.number().nonnegative().optional(),
  }),
});

export const updateDoctorSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    specialty: z.string().min(2).optional(),
    qualification: z.string().optional(),
    experienceYears: z.number().int().nonnegative().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    consultationFee: z.number().nonnegative().optional(),
  }),
});

export const listDoctorsSchema = z.object({
  query: z.object({
    specialty: z.string().optional(),
    hospitalId: z.string().optional(),
    search: z.string().optional(),
  }),
});
