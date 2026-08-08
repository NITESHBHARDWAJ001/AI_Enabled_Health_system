import { z } from "zod";

export const setAvailabilitySchema = z.object({
  body: z.object({
    windows: z.array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startMinutes: z.number().int().min(0).max(1440),
        endMinutes: z.number().int().min(0).max(1440),
      })
    ),
  }),
});

export const availableSlotsSchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  }),
});
