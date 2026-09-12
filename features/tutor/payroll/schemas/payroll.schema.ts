import { z } from 'zod';

export const processPayrollSchema = z.object({
  tutorId: z.string().uuid({ message: 'ID Tutor tidak valid' }),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  bonus: z.number().min(0, 'Bonus tidak boleh negatif').default(0),
  deduction: z.number().min(0, 'Potongan tidak boleh negatif').default(0),
});

export const updateTutorRateSchema = z.object({
  tutorId: z.string().uuid({ message: 'ID Tutor tidak valid' }),
  bimbelTypeId: z.string().uuid({ message: 'ID Jenis Bimbel tidak valid' }),
  ratePerStudent: z.number().positive('Tarif harus lebih dari 0'),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  effectiveUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional().nullable(),
});

export type ProcessPayrollInput = z.infer<typeof processPayrollSchema>;
export type UpdateTutorRateInput = z.infer<typeof updateTutorRateSchema>;
