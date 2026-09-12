import { z } from 'zod';

export const studentSchema = z.object({
  studentCode: z
    .string()
    .min(3, 'Kode murid minimal 3 karakter')
    .max(50, 'Kode murid maksimal 50 karakter')
    .regex(/^[A-Za-z0-9_-]+$/, 'Kode murid hanya boleh berupa huruf, angka, tanda strip, atau underscore'),
  name: z.string().min(2, 'Nama murid minimal 2 karakter').max(150, 'Nama murid maksimal 150 karakter'),
  gender: z.enum(['male', 'female']).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  school: z.string().max(100).optional().nullable(),
  grade: z.string().max(20).optional().nullable(),
  parentName: z.string().max(100).optional().nullable(),
  parentPhone: z
    .string()
    .max(20, 'Nomor telepon maksimal 20 karakter')
    .regex(/^[0-9+() -]*$/, 'Format nomor telepon tidak valid')
    .optional()
    .nullable(),
  address: z.string().max(300).optional().nullable(),
  status: z.enum(['active', 'inactive', 'graduated']),
});

export type StudentInput = z.infer<typeof studentSchema>;
