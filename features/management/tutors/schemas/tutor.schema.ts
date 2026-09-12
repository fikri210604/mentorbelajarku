import { z } from "zod";

export const tutorSchema = z.object({
  fullName: z.string().min(2, "Nama tutor minimal 2 karakter").max(150),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type TutorInput = z.infer<typeof tutorSchema>;
