import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s]{8,20}$/, "Nomor telepon/WhatsApp tidak valid")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500, "Bio maksimal 500 karakter").optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter")
      .regex(/[A-Za-z]/, "Password baru harus mengandung minimal 1 huruf")
      .regex(/[0-9]/, "Password baru harus mengandung minimal 1 angka"),
    confirmPassword: z.string().min(1, "Konfirmasi password baru wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok dengan password baru",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
