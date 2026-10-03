import { z } from 'zod';

export const attendanceStatusEnum = z.enum(['present', 'absent', 'permission', 'sick', 'late']);
export const verificationStatusEnum = z.enum(['submitted', 'verified', 'correction_requested']);

export const submitAttendanceItemSchema = z.object({
  studentId: z.string().min(1, { message: 'ID Murid tidak valid' }),
  status: attendanceStatusEnum,
  material: z.string().max(1000, 'Catatan materi maksimal 1000 karakter').optional().nullable(),
  notes: z.string().max(500, 'Catatan tambahan maksimal 500 karakter').optional().nullable(),
});

export const submitSessionAttendanceSchema = z.object({
  sessionId: z.string().min(1, { message: 'ID Sesi tidak valid' }),
  // 1x foto dokumentasi untuk seluruh murid sesi (wajib).
  sessionPhotoBase64: z
    .string()
    .min(1, { message: 'Foto bukti presensi wajib dilampirkan.' }),
  items: z.array(submitAttendanceItemSchema).min(1, 'Minimal satu murid harus diabsen'),
});

export const verifyAttendanceSchema = z.object({
  attendanceId: z.string().uuid({ message: 'ID Absensi tidak valid' }),
  verificationStatus: verificationStatusEnum,
  notes: z.string().max(500).optional().nullable(),
});

export const overrideAttendanceWindowSchema = z.object({
  sessionId: z.string().uuid({ message: 'ID Sesi tidak valid' }),
  reason: z.string().min(10, { message: 'Alasan override minimal 10 karakter' }),
});

export type SubmitAttendanceItemInput = z.infer<typeof submitAttendanceItemSchema>;
export type SubmitSessionAttendanceInput = z.infer<typeof submitSessionAttendanceSchema>;
export type VerifyAttendanceInput = z.infer<typeof verifyAttendanceSchema>;
export type OverrideAttendanceWindowInput = z.infer<typeof overrideAttendanceWindowSchema>;
