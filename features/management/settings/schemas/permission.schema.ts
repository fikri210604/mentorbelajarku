import { z } from "zod";

export const permissionSchema = z.object({
  id: z
    .string()
    .min(3, "Identifier permission minimal 3 karakter")
    .max(100, "Identifier permission maksimal 100 karakter")
    .regex(
      /^[a-z0-9_]+:[a-z0-9_]+$/,
      "Format identifier wajib 'modul:aksi' (contoh: worksheet:approve, laporan:read)"
    ),
  category: z
    .string()
    .min(2, "Kategori minimal 2 karakter")
    .max(50, "Kategori maksimal 50 karakter"),
  name: z
    .string()
    .min(2, "Nama permission minimal 2 karakter")
    .max(150, "Nama permission maksimal 150 karakter"),
  description: z
    .string()
    .max(300, "Deskripsi maksimal 300 karakter")
    .optional()
    .nullable(),
});

export type PermissionInput = z.infer<typeof permissionSchema>;
