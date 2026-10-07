"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { formatZodError, getSafeErrorMessage } from "@/lib/traits/response.trait";
import { checkPermission } from "@/lib/auth/session";
import {
  isScheduleSlotInPast,
  scheduleSchema,
  ScheduleInput,
} from "../schemas/schedule.schema";
import { SessionGeneratorService } from "@/features/shared/sessions/services/session-generator.service";

/** Tambahkan menit ke format waktu `HH:mm` (mengabaikan overflow hari). */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const endHours = Math.floor(total / 60) % 24;
  const endMinutes = total % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

interface EnrollmentDurationRow {
  student_id: string;
  program_id: string;
  id: string;
  bimbel_type_id: string | null;
  bimbel_types: { duration_minutes?: number } | null;
}

export async function createSchedule(input: ScheduleInput) {
  const { allowed, user } = await checkPermission("schedule:create");
  if (!allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak membuat jadwal." };
  }

  try {
    // Validasi Zod dikembalikan sebagai pesan ramah, bukan raw ZodError (500 JSON).
    const parsed = scheduleSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }
    const validated = parsed.data;

    // Validasi bisnis: slot yang dipilih tidak boleh sudah lewat
    // (hari terpilih = hari ini dan jam mulai sudah terlewat).
    const { inPast, slotLabel } = isScheduleSlotInPast(validated.dayOfWeek, validated.startTime);
    if (inPast) {
      return {
        success: false,
        error: `Jadwal tidak dapat dibuat karena waktunya sudah lewat (${slotLabel}). Silakan pilih hari atau jam yang masih akan datang.`,
      };
    }

    const supabase = createServerClient();
    const studentIds = validated.studentIds;

    // Jenis bimbel & durasi adalah atribut PER MURID (enrollment), bukan input manual.
    // Resolve di server: jenis seragam -> diisi, campur -> NULL; jam selesai = tipe terlama.
    let resolvedTypeId: string | null = null;
    let endTime = validated.endTime;
    const enrollmentByStudent = new Map<string, string>();

    if (studentIds.length > 0) {
      const { data: enrollmentRows } = await supabase
        .from("enrollments")
        .select("id, student_id, program_id, bimbel_type_id, bimbel_types ( duration_minutes )")
        .in("student_id", studentIds)
        .eq("status", "active")
        .order("start_date", { ascending: false });

      const rows = (enrollmentRows ?? []) as unknown as EnrollmentDurationRow[];

      // Hanya enrollment pada PROGRAM jadwal ini yang relevan untuk durasi & quota.
      const relevant = rows.filter((r) => r.program_id === validated.programId);

      const typeIds = Array.from(
        new Set(
          relevant
            .map((r) => r.bimbel_type_id)
            .filter((v): v is string => Boolean(v))
        )
      );
      resolvedTypeId = typeIds.length === 1 ? typeIds[0] : null;

      const durations = relevant
        .map((r) => r.bimbel_types?.duration_minutes)
        .filter((d): d is number => typeof d === "number" && d > 0);
      if (durations.length > 0) {
        endTime = addMinutes(validated.startTime, Math.max(...durations));
      }

      // Simpan enrollment aktif murid pada program ini di schedule_students,
      // supaya "Pertemuan ke" dapat dilacak per paket murid (bukan global).
      for (const row of relevant) {
        if (!enrollmentByStudent.has(row.student_id)) {
          enrollmentByStudent.set(row.student_id, row.id);
        }
      }
    }

    const { data: schedule, error: schErr } = await supabase
      .from("schedules")
      .insert({
        tutor_id: validated.tutorId,
        program_id: validated.programId,
        bimbel_type_id: resolvedTypeId,
        day_of_week: validated.dayOfWeek,
        start_time: validated.startTime,
        end_time: endTime,
        location: validated.location ?? null,
        notes: validated.notes ?? null,
        status: validated.status,
      })
      .select()
      .single();

    if (schErr || !schedule) {
      return { success: false, error: "Gagal membuat jadwal. Periksa kembali data yang dimasukkan." };
    }

    if (studentIds.length > 0) {
      const mappingRows = studentIds.map((stId) => ({
        schedule_id: schedule.id,
        student_id: stId,
        enrollment_id: enrollmentByStudent.get(stId) ?? null,
      }));

      const { error: mapErr } = await supabase.from("schedule_students").insert(mappingRows);

      if (mapErr) {
        // Batalkan jadwal yatim agar tidak ada jadwal tanpa peserta.
        await supabase.from("schedules").delete().eq("id", schedule.id);
        return { success: false, error: "Gagal menautkan murid ke jadwal." };
      }
    }

    // Materialisasi SESI PERTAMA dari jadwal ini (Schedule hanya rencana — §6;
    // absensi menempel pada sesi bertanggal konkret). Idempoten: generator
    // melewati (schedule, tanggal) yang sudah ada. Kegagalan tidak membatalkan jadwal.
    const now = new Date();
    const dayDiff = (validated.dayOfWeek - now.getDay() + 7) % 7;
    const firstOccurrence = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + dayDiff
    );
    const firstSessionDate = `${firstOccurrence.getFullYear()}-${String(
      firstOccurrence.getMonth() + 1
    ).padStart(2, "0")}-${String(firstOccurrence.getDate()).padStart(2, "0")}`;

    let sessionNote: string | null = null;
    try {
      const gen = await SessionGeneratorService.generateSessions({
        scheduleId: schedule.id,
        targetDate: firstSessionDate,
        userId: user?.user.id,
      });
      if (!gen.success) {
        sessionNote = "Sesi pertama belum terbentuk otomatis — buat manual dari halaman Sesi Belajar.";
        console.error("Auto-generate first session failed:", gen.errors);
      }
    } catch (genErr) {
      sessionNote = "Sesi pertama belum terbentuk otomatis — buat manual dari halaman Sesi Belajar.";
      console.error("Auto-generate first session error:", genErr);
    }

    await supabase.from("audit_logs").insert({
      action: "SCHEDULE_CREATED",
      entity_type: "schedule",
      entity_id: schedule.id,
      user_id: user?.user.id ?? null,
      metadata: {
        tutorId: validated.tutorId,
        studentCount: studentIds.length,
        studentIds: studentIds,
        dayOfWeek: validated.dayOfWeek,
        time: `${validated.startTime}-${endTime}`,
        bimbelTypeId: resolvedTypeId,
        firstSessionDate,
        subjectId: validated.subjectId,
        targetMaterial: validated.targetMaterial,
      },
    });

    revalidatePath("/management/schedules");
    revalidatePath("/tutor/schedules");
    revalidatePath("/tutor/attendance");
    revalidatePath("/management/sessions");
    return { success: true, data: schedule, message: sessionNote ?? undefined };
  } catch (err: unknown) {
    console.error("Create schedule error:", err);
    return {
      success: false,
      error: getSafeErrorMessage(err, "Terjadi kesalahan sistem saat membuat jadwal."),
    };
  }
}
