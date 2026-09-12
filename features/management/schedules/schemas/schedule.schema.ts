import { z } from "zod";

export const scheduleSchema = z.object({
  tutorId: z.string().min(1, "Tutor harus dipilih"),
  programId: z.string().min(1, "Program studi harus dipilih"),
  bimbelTypeId: z.string().min(1, "Jenis bimbel harus dipilih"),
  studentId: z.string().optional().nullable(),
  studentIds: z
    .array(z.string())
    .min(1, "Pilih minimal 1 murid untuk jadwal ini (1 murid = privat, >1 murid = kelompok)"),
  classGroupId: z.string().optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam mulai tidak valid (HH:mm)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam selesai tidak valid (HH:mm)"),
  location: z.string().max(100).optional().nullable(),
  notes: z.string().max(255).optional().nullable(),
  status: z.enum(["active", "inactive"]),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;
