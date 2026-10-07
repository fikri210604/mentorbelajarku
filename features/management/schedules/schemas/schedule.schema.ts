import { z } from "zod";

export const scheduleSchema = z.object({
  tutorId: z.string().min(1, "Tutor harus dipilih"),
  programId: z.string().min(1, "Program bimbel harus dipilih"),
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
  // Kurikulum & Penugasan Materi Pembelajaran
  subjectId: z.string().optional().nullable(),
  topicId: z.string().optional().nullable(),
  targetMaterial: z.string().max(255).optional().nullable(),
  worksheetUrl: z.string().optional().nullable(),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;

const DAY_NAMES_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

/**
 * Cek apakah slot jadwal mingguan yang dipilih sudah lewat.
 * Slot di-resolve ke kejadian pada HARI yang dipilih:
 * - bila hari terpilih = hari ini dan jam mulai sudah terlewat -> sudah lewat;
 * - hari lain pada minggu ini -> kejadian berikutnya jatuh minggu depan (masih akan datang).
 * Memakai waktu lokal perangkat/server (konvensi WIB seperti util presensi).
 */
export function isScheduleSlotInPast(
  dayOfWeek: number,
  startTime: string,
  now: Date = new Date()
): { inPast: boolean; slotLabel: string } {
  const dayName = DAY_NAMES_ID[dayOfWeek] ?? "Hari terpilih";
  const slotLabel = `${dayName}, ${startTime} WIB`;

  const [hourStr, minuteStr] = startTime.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return { inPast: false, slotLabel };
  }

  if (dayOfWeek !== now.getDay()) {
    return { inPast: false, slotLabel };
  }

  const slotStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0
  );
  return { inPast: slotStart.getTime() < now.getTime(), slotLabel };
}
