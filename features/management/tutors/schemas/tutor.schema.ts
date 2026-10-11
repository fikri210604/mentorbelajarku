import { z } from "zod";

export const createTutorSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nama tutor minimal 2 karakter")
    .max(150, "Nama tutor maksimal 150 karakter")
    .trim(),
  gender: z.enum(["male", "female"]).default("male"),
  email: z
    .string()
    .email("Format alamat email tidak valid")
    .max(150, "Email maksimal 150 karakter")
    .trim()
    .toLowerCase(),
  phone: z
    .string()
    .max(25, "Nomor telepon maksimal 25 karakter")
    .optional()
    .nullable()
    .transform((val) => (val?.trim() ? val.trim() : null)),
  bio: z
    .string()
    .max(500, "Bio atau deskripsi keahlian maksimal 500 karakter")
    .optional()
    .nullable()
    .transform((val) => (val?.trim() ? val.trim() : null)),
  status: z.enum(["active", "inactive"]).default("active"),
  customPassword: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")),
  sendEmail: z.boolean().default(true),
});

export const updateTutorSchema = z.object({
  id: z.string().uuid("ID tutor tidak valid"),
  fullName: z
    .string()
    .min(2, "Nama tutor minimal 2 karakter")
    .max(150, "Nama tutor maksimal 150 karakter")
    .trim(),
  gender: z.enum(["male", "female"]).default("male"),
  email: z
    .string()
    .email("Format alamat email tidak valid")
    .max(150, "Email maksimal 150 karakter")
    .trim()
    .toLowerCase(),
  phone: z
    .string()
    .max(25, "Nomor telepon maksimal 25 karakter")
    .optional()
    .nullable()
    .transform((val) => (val?.trim() ? val.trim() : null)),
  bio: z
    .string()
    .max(500, "Bio atau deskripsi keahlian maksimal 500 karakter")
    .optional()
    .nullable()
    .transform((val) => (val?.trim() ? val.trim() : null)),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const resendCredentialsSchema = z.object({
  tutorId: z.string().uuid("ID tutor tidak valid"),
  customPassword: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")),
  sendEmail: z.boolean().default(true),
});

export const tutorSchema = createTutorSchema;

export type CreateTutorInput = z.infer<typeof createTutorSchema>;
export type UpdateTutorInput = z.infer<typeof updateTutorSchema>;
export type ResendCredentialsInput = z.infer<typeof resendCredentialsSchema>;
export type TutorInput = CreateTutorInput;
