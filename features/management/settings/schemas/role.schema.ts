import { z } from "zod";

export const roleSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(2, "Identifier role minimal 2 karakter")
    .max(50, "Identifier role maksimal 50 karakter")
    .regex(/^[a-z0-9_-]+$/, "Identifier role hanya boleh huruf kecil, angka, garis bawah (_), dan tanda hubung (-)"),
  display_name: z
    .string()
    .min(2, "Nama tampilan role minimal 2 karakter")
    .max(100, "Nama tampilan role maksimal 100 karakter"),
  description: z.string().max(300, "Deskripsi maksimal 300 karakter").optional(),
});

export type RoleInput = z.infer<typeof roleSchema>;

export const rolePermissionsUpdateSchema = z.object({
  role_id: z.string().min(1, "Role ID wajib diisi"),
  permissions: z.array(z.string()),
});

export type RolePermissionsUpdateInput = z.infer<typeof rolePermissionsUpdateSchema>;
