import { z } from 'zod';

export const attendanceStatusEnum = z.enum(['present', 'absent', 'permission', 'sick', 'late']);
export const verificationStatusEnum = z.enum(['submitted', 'verified', 'correction_requested']);

export const submitAttendanceItemSchema = z.object({
  studentId: z.string().uuid({ message: 'ID Murid tidak valid' }),
  studentProgramId: z.string().uuid({ message: 'ID Program/Enrollment murid tidak valid' }).optional().nullable(),
  status: attendanceStatusEnum,
  photoPath: z.string().optional().nullable(),
  photoBase64: z.string().optional().nullable(), // Captured image from react-webcam
  material: z.string().max(1000, 'Catatan materi maksimal 1000 karakter').optional().nullable(),
  notes: z.string().max(500, 'Catatan tambahan maksimal 500 karakter').optional().nullable(),
});

export const submitSessionAttendanceSchema = z.object({
  sessionId: z.string().uuid({ message: 'ID Sesi tidak valid' }),
  items: z.array(submitAttendanceItemSchema).min(1, 'Minimal satu murid harus diabsen'),
});

export const verifyAttendanceSchema = z.object({
  attendanceId: z.string().uuid({ message: 'ID Absensi tidak valid' }),
  verificationStatus: verificationStatusEnum,
  notes: z.string().max(500).optional().nullable(),
});

export type SubmitAttendanceItemInput = z.infer<typeof submitAttendanceItemSchema>;
export type SubmitSessionAttendanceInput = z.infer<typeof submitSessionAttendanceSchema>;
export type VerifyAttendanceInput = z.infer<typeof verifyAttendanceSchema>;
