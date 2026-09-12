import { z } from "zod";

export const scheduleSchema = z.object({
  tutorId: z.string().uuid("Tutor harus dipilih"),
  programId: z.string().uuid("Program harus dipilih"),
  bimbelTypeId: z.string().uuid("Jenis bimbel harus dipilih"),
  studentId: z.string().uuid().optional().nullable(),
  classGroupId: z.string().uuid().optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam tidak valid (HH:mm)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam tidak valid (HH:mm)"),
  location: z.string().max(100).optional().nullable(),
  status: z.enum(["active", "inactive"]),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;
