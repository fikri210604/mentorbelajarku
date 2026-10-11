"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { formatZodError, getSafeErrorMessage } from "@/lib/traits/response.trait";
import { checkPermission } from "@/lib/auth/session";
import {
  scheduleSchema,
  ScheduleInput,
  updateScheduleSeriesSchema,
  UpdateScheduleSeriesInput,
  scheduleExceptionSchema,
  ScheduleExceptionInput,
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

    // Validasi bisnis: tanggal mulai pengulangan tidak boleh di masa lalu (WIB).
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    if (validated.recurrence.startDate < todayStr) {
      return {
        success: false,
        error: `Tanggal mulai pengulangan (${validated.recurrence.startDate}) sudah lewat. Pilih tanggal hari ini atau yang akan datang.`,
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

    // days_of_week adalah sumber kebenaran hari; day_of_week di-derive DB (generated).
    const daysOfWeek = [...validated.recurrence.daysOfWeek].sort((a, b) => a - b);
    const { data: schedule, error: schErr } = await supabase
      .from("schedules")
      .insert({
        tutor_id: validated.tutorId,
        program_id: validated.programId,
        bimbel_type_id: resolvedTypeId,
        days_of_week: daysOfWeek,
        recurrence_start_date: validated.recurrence.startDate,
        recurrence_interval: validated.recurrence.intervalWeeks,
        recurrence_count: validated.recurrence.endMode === "count" ? validated.recurrence.count : null,
        recurrence_until: validated.recurrence.endMode === "until" ? validated.recurrence.until : null,
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

    // Materialisasi sesi 30 hari ke depan dari rule pengulangan (Schedule hanya
    // rencana (pasal 6); absensi menempel pada sesi bertanggal konkret). Idempoten:
    // generator melewati (schedule, tanggal) yang sudah ada. Kegagalan tidak
    // membatalkan jadwal.
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 30);
    const windowEndStr = `${windowEnd.getFullYear()}-${String(windowEnd.getMonth() + 1).padStart(2, "0")}-${String(windowEnd.getDate()).padStart(2, "0")}`;

    let sessionNote: string | null = null;
    try {
      const gen = await SessionGeneratorService.generateSessions({
        scheduleId: schedule.id,
        startDate: todayStr,
        endDate: windowEndStr,
        userId: user?.user.id,
      });
      if (!gen.success) {
        sessionNote = "Sesi awal belum terbentuk otomatis - buat manual dari halaman Sesi Belajar.";
        console.error("Auto-generate initial sessions failed:", gen.errors);
      } else if (gen.createdCount > 0) {
        sessionNote = `${gen.createdCount} sesi awal terbentuk otomatis (30 hari ke depan).`;
      }
    } catch (genErr) {
      sessionNote = "Sesi awal belum terbentuk otomatis - buat manual dari halaman Sesi Belajar.";
      console.error("Auto-generate initial sessions error:", genErr);
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
        daysOfWeek,
        recurrence: validated.recurrence,
        time: `${validated.startTime}-${endTime}`,
        bimbelTypeId: resolvedTypeId,
        subjectId: validated.subjectId,
        targetMaterial: validated.targetMaterial,
      },
    });

    // Notifikasi push "jadwal baru" ke tutor (best-effort; kegagalan TIDAK
    // membatalkan pembuatan jadwal). Lihat fitur shared/web-push.
    try {
      const { notifyScheduleCreated } = await import(
        "@/features/shared/web-push/services/notification.service"
      );
      await notifyScheduleCreated({
        scheduleId: schedule.id,
        tutorId: validated.tutorId,
      });
    } catch (notifErr) {
      console.warn("notifyScheduleCreated skipped:", notifErr);
    }

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

/**
 * Server Action: Ubah SERI jadwal (template + rule pengulangan).
 * Kontrak edit seri: TIDAK PERNAH menyentuh baris sessions yang sudah
 * ter-generate (historis immutable). Sesi future yang sudah ada dibiarkan
 * dan jumlahnya dilaporkan sebagai warning agar Management menindaklanjuti
 * manual (batalkan/geser per sesi bila perlu).
 */
export async function updateScheduleSeries(input: UpdateScheduleSeriesInput) {
  const { allowed, user } = await checkPermission("schedule:update");
  if (!allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak mengubah jadwal." };
  }

  try {
    const parsed = updateScheduleSeriesSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }
    const validated = parsed.data;
    const supabase = createServerClient();

    const { data: existing, error: fetchErr } = await supabase
      .from("schedules")
      .select(
        "id, days_of_week, recurrence_start_date, recurrence_interval, recurrence_count, recurrence_until, start_time, end_time, location, notes, status"
      )
      .eq("id", validated.scheduleId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { success: false, error: "Jadwal tidak ditemukan." };
    }

    const daysOfWeek = [...validated.daysOfWeek].sort((a, b) => a - b);
    const { error: updateErr } = await supabase
      .from("schedules")
      .update({
        days_of_week: daysOfWeek,
        recurrence_start_date: validated.startDate,
        recurrence_interval: validated.intervalWeeks,
        recurrence_count: validated.endMode === "count" ? validated.count : null,
        recurrence_until: validated.endMode === "until" ? validated.until : null,
        start_time: validated.startTime,
        end_time: validated.endTime,
        location: validated.location ?? null,
        notes: validated.notes ?? null,
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.scheduleId);

    if (updateErr) {
      return { success: false, error: "Gagal memperbarui seri jadwal." };
    }

    // Hitung sesi future yang sudah ter-generate (tidak ikut berubah).
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const { count: futureCount } = await supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("schedule_id", validated.scheduleId)
      .gte("session_date", todayStr);

    const warning =
      (futureCount ?? 0) > 0
        ? `Perubahan hanya berlaku untuk sesi yang belum ter-generate. ${futureCount} sesi mendatang yang sudah ada TIDAK diubah - batalkan/geser manual bila perlu.`
        : null;

    await supabase.from("audit_logs").insert({
      action: "SCHEDULE_SERIES_UPDATED",
      entity_type: "schedule",
      entity_id: validated.scheduleId,
      user_id: user?.user.id ?? null,
      metadata: {
        before: existing,
        after: validated,
        untouched_future_sessions: futureCount ?? 0,
      },
    });

    revalidatePath("/management/schedules");
    revalidatePath("/tutor/schedules");
    revalidatePath("/management/sessions");
    return { success: true, warning };
  } catch (err: unknown) {
    console.error("Update schedule series error:", err);
    return {
      success: false,
      error: getSafeErrorMessage(err, "Terjadi kesalahan sistem saat memperbarui seri jadwal."),
    };
  }
}

/**
 * Server Action: Tambah pengecualian tanggal (libur/izin) pada seri jadwal.
 * Generator melewati tanggal ini; kuota count TIDAK ikut terpakai.
 */
export async function addScheduleException(input: ScheduleExceptionInput) {
  const { allowed, user } = await checkPermission("schedule:update");
  if (!allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak mengubah jadwal." };
  }

  try {
    const parsed = scheduleExceptionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }
    const validated = parsed.data;
    const supabase = createServerClient();

    const { error } = await supabase.from("schedule_exceptions").upsert(
      {
        schedule_id: validated.scheduleId,
        exception_date: validated.date,
        reason: validated.reason ?? null,
        created_by: user?.user.id ?? null,
      },
      { onConflict: "schedule_id,exception_date" }
    );

    if (error) {
      return { success: false, error: "Gagal menyimpan pengecualian tanggal." };
    }

    await supabase.from("audit_logs").insert({
      action: "SCHEDULE_EXCEPTION_ADDED",
      entity_type: "schedule",
      entity_id: validated.scheduleId,
      user_id: user?.user.id ?? null,
      metadata: { exception_date: validated.date, reason: validated.reason ?? null },
    });

    revalidatePath("/management/schedules");
    revalidatePath("/management/sessions");
    return { success: true };
  } catch (err: unknown) {
    console.error("Add schedule exception error:", err);
    return {
      success: false,
      error: getSafeErrorMessage(err, "Terjadi kesalahan sistem saat menyimpan pengecualian."),
    };
  }
}

/**
 * Server Action: Hapus pengecualian tanggal pada seri jadwal.
 */
export async function removeScheduleException(input: ScheduleExceptionInput) {
  const { allowed, user } = await checkPermission("schedule:update");
  if (!allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak mengubah jadwal." };
  }

  try {
    const parsed = scheduleExceptionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }
    const validated = parsed.data;
    const supabase = createServerClient();

    const { error } = await supabase
      .from("schedule_exceptions")
      .delete()
      .eq("schedule_id", validated.scheduleId)
      .eq("exception_date", validated.date);

    if (error) {
      return { success: false, error: "Gagal menghapus pengecualian tanggal." };
    }

    await supabase.from("audit_logs").insert({
      action: "SCHEDULE_EXCEPTION_REMOVED",
      entity_type: "schedule",
      entity_id: validated.scheduleId,
      user_id: user?.user.id ?? null,
      metadata: { exception_date: validated.date },
    });

    revalidatePath("/management/schedules");
    revalidatePath("/management/sessions");
    return { success: true };
  } catch (err: unknown) {
    console.error("Remove schedule exception error:", err);
    return {
      success: false,
      error: getSafeErrorMessage(err, "Terjadi kesalahan sistem saat menghapus pengecualian."),
    };
  }
}

/**
 * Server Action: Update Jadwal Rutin Lengkap (Master Template, Siswa, dan Recurrence)
 */
export async function updateScheduleAction(scheduleId: string, input: ScheduleInput) {
  const { allowed, user } = await checkPermission("schedule:update");
  if (!allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak mengubah jadwal." };
  }

  try {
    const parsed = scheduleSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }
    const validated = parsed.data;
    const supabase = createServerClient();
    const nowIso = new Date().toISOString();

    const studentIds = validated.studentIds;
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

      for (const row of relevant) {
        if (!enrollmentByStudent.has(row.student_id)) {
          enrollmentByStudent.set(row.student_id, row.id);
        }
      }
    }

    const daysOfWeek = [...validated.recurrence.daysOfWeek].sort((a, b) => a - b);

    // Update master schedule
    const { error: updateErr } = await supabase
      .from("schedules")
      .update({
        tutor_id: validated.tutorId,
        program_id: validated.programId,
        bimbel_type_id: resolvedTypeId,
        days_of_week: daysOfWeek,
        recurrence_start_date: validated.recurrence.startDate,
        recurrence_interval: validated.recurrence.intervalWeeks,
        recurrence_count: validated.recurrence.endMode === "count" ? validated.recurrence.count : null,
        recurrence_until: validated.recurrence.endMode === "until" ? validated.recurrence.until : null,
        start_time: validated.startTime,
        end_time: endTime,
        location: validated.location ?? null,
        notes: validated.notes ?? null,
        status: validated.status,
        updated_at: nowIso,
      })
      .eq("id", scheduleId);

    if (updateErr) {
      return { success: false, error: "Gagal memperbarui jadwal rutin." };
    }

    // Update schedule_students
    await supabase.from("schedule_students").delete().eq("schedule_id", scheduleId);
    if (studentIds.length > 0) {
      const studentRows = studentIds.map((sid) => ({
        schedule_id: scheduleId,
        student_id: sid,
        enrollment_id: enrollmentByStudent.get(sid) ?? null,
      }));
      await supabase.from("schedule_students").insert(studentRows);
    }

    // Sinkronkan sesi-sesi mendatang yang masih 'scheduled'
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const { data: updatedSessions } = await supabase
      .from("sessions")
      .update({
        start_time: validated.startTime,
        end_time: endTime,
        tutor_id: validated.tutorId,
        updated_by: user?.user.id ?? null,
        updated_at: nowIso,
      })
      .eq("schedule_id", scheduleId)
      .gte("session_date", todayStr)
      .eq("status", "scheduled")
      .select("id");

    await supabase.from("audit_logs").insert({
      action: "SCHEDULE_UPDATED",
      entity_type: "schedules",
      entity_id: scheduleId,
      user_id: user?.user.id ?? null,
      metadata: {
        updated_by: user?.user.id,
        future_sessions_synced: updatedSessions?.length ?? 0,
      },
    });

    revalidatePath("/management/schedules");
    revalidatePath(`/management/schedules/${scheduleId}`);
    revalidatePath("/management/sessions");
    revalidatePath("/tutor/schedules");

    return {
      success: true,
      message: `Jadwal rutin berhasil diperbarui! (${updatedSessions?.length ?? 0} sesi mendatang diselaraskan)`,
    };
  } catch (err: unknown) {
    console.error("updateScheduleAction error:", err);
    return {
      success: false,
      error: getSafeErrorMessage(err, "Gagal memperbarui jadwal."),
    };
  }
}

