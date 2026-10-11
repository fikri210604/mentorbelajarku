import { createServerSupabaseClient } from "@/lib/supabase/server";
import { expandOccurrences } from "@/lib/utils/recurrence";

export interface GenerateSessionsInput {
  targetDate?: string; // Format: YYYY-MM-DD (default hari ini)
  startDate?: string;
  endDate?: string;
  scheduleId?: string; // Opsional: hanya untuk satu jadwal tertentu
  tutorId?: string;    // Opsional: hanya untuk tutor tertentu
  userId?: string;     // ID user yang memicu generasi (untuk audit log)
}

export interface GeneratedSessionSummary {
  id: string;
  scheduleId: string;
  sessionDate: string;
  tutorId: string;
  programId: string;
  studentCount: number;
}

export interface GenerateSessionsResult {
  success: boolean;
  totalEvaluated: number;
  createdCount: number;
  skippedCount: number;
  createdSessions: GeneratedSessionSummary[];
  errors: string[];
}

interface ScheduleRow {
  id: string;
  tutor_id: string;
  program_id: string;
  bimbel_type_id: string | null;
  day_of_week: number;
  days_of_week: number[] | null;
  recurrence_start_date: string | null;
  recurrence_interval: number | null;
  recurrence_count: number | null;
  recurrence_until: string | null;
  start_time: string;
  end_time: string;
  notes: string | null;
  schedule_students?: { id: string; student_id: string; enrollment_id: string | null }[] | null;
}

/**
 * Service untuk men-generate record sesi pembelajaran aktual (sessions)
 * dari rancangan jadwal rutin (schedules).
 *
 * Sesuai AGENTS.md Rule 6:
 * - Schedule: Rencana belajar rutin + aturan pengulangan (migration 0005)
 * - Session: Kejadian pembelajaran aktual pada tanggal tertentu
 *
 * Kontrak edit seri: generator hanya MEMBUAT sesi yang belum ada; tidak pernah
 * mengubah/menghapus sesi existing (sesi historis immutable).
 */
export class SessionGeneratorService {
  /**
   * Eksekusi pembangkitan sesi aktual dari jadwal aktif.
   */
  static async generateSessions(
    options: GenerateSessionsInput = {}
  ): Promise<GenerateSessionsResult> {
    const supabase = createServerSupabaseClient();
    const result: GenerateSessionsResult = {
      success: true,
      totalEvaluated: 0,
      createdCount: 0,
      skippedCount: 0,
      createdSessions: [],
      errors: [],
    };

    try {
      // 1. Tentukan jendela tanggal yang diproses
      let windowStart: string;
      let windowEnd: string;
      if (options.startDate && options.endDate) {
        windowStart = options.startDate;
        windowEnd = options.endDate;
      } else if (options.targetDate) {
        windowStart = options.targetDate;
        windowEnd = options.targetDate;
      } else {
        // Default hari ini (lokal)
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        windowStart = `${y}-${m}-${d}`;
        windowEnd = windowStart;
      }

      if (windowEnd < windowStart) {
        result.success = false;
        result.errors.push("Rentang tanggal tidak valid (endDate < startDate).");
        return result;
      }

      // 2. Ambil seluruh jadwal aktif beserta relasi muridnya
      let scheduleQuery = supabase
        .from("schedules")
        .select(
          `
          id,
          tutor_id,
          program_id,
          bimbel_type_id,
          day_of_week,
          days_of_week,
          recurrence_start_date,
          recurrence_interval,
          recurrence_count,
          recurrence_until,
          start_time,
          end_time,
          notes,
          status,
          schedule_students (
            id,
            student_id,
            enrollment_id
          )
        `
        )
        .eq("status", "active");

      if (options.scheduleId) {
        scheduleQuery = scheduleQuery.eq("id", options.scheduleId);
      }
      if (options.tutorId) {
        scheduleQuery = scheduleQuery.eq("tutor_id", options.tutorId);
      }

      const { data: scheduleRows, error: scheduleErr } = await scheduleQuery;

      if (scheduleErr || !scheduleRows) {
        result.success = false;
        result.errors.push(`Gagal mengambil data jadwal: ${scheduleErr?.message || "Data kosong"}`);
        return result;
      }

      const schedules = scheduleRows as unknown as ScheduleRow[];
      if (schedules.length === 0) {
        return result;
      }
      const scheduleIds = schedules.map((s) => s.id);

      // 3. Ambil sesi existing + pengecualian dalam SATU query masing-masing
      // (bukan per-tanggal seperti sebelumnya).
      const [{ data: existingSessions, error: existErr }, { data: exceptions }] =
        await Promise.all([
          supabase
            .from("sessions")
            .select("schedule_id, session_date")
            .gte("session_date", windowStart)
            .lte("session_date", windowEnd)
            .in("schedule_id", scheduleIds),
          supabase
            .from("schedule_exceptions")
            .select("schedule_id, exception_date")
            .gte("exception_date", windowStart)
            .lte("exception_date", windowEnd)
            .in("schedule_id", scheduleIds),
        ]);

      if (existErr) {
        result.success = false;
        result.errors.push(`Gagal mengecek sesi eksisting: ${existErr.message}`);
        return result;
      }

      const existingSet = new Set(
        (existingSessions || []).map(
          (s) => `${(s as { schedule_id: string }).schedule_id}|${(s as { session_date: string }).session_date}`
        )
      );
      const exceptBySchedule = new Map<string, string[]>();
      for (const e of (exceptions || []) as { schedule_id: string; exception_date: string }[]) {
        const list = exceptBySchedule.get(e.schedule_id) ?? [];
        list.push(e.exception_date);
        exceptBySchedule.set(e.schedule_id, list);
      }

      // 4. Kembangkan occurrence per jadwal dari rule-nya (bukan day_of_week tunggal)
      const toInsert: {
        schedule_id: string;
        tutor_id: string;
        program_id: string;
        bimbel_type_id: string | null;
        session_date: string;
        start_time: string;
        end_time: string;
        status: "scheduled";
        notes: string | null;
        created_by: string | null;
      }[] = [];
      const metaByKey = new Map<
        string,
        { schedule: ScheduleRow; studentCount: number }
      >();

      for (const schedule of schedules) {
        let occurrences: string[];
        try {
          occurrences = expandOccurrences(
            {
              // Fallback legacy (pra-migration): mingguan tanpa akhir mulai jendela.
              startDate: schedule.recurrence_start_date ?? windowStart,
              daysOfWeek:
                schedule.days_of_week && schedule.days_of_week.length > 0
                  ? schedule.days_of_week
                  : [schedule.day_of_week],
              intervalWeeks: schedule.recurrence_interval ?? 1,
              count: schedule.recurrence_count,
              until: schedule.recurrence_until,
            },
            {
              from: windowStart,
              to: windowEnd,
              except: exceptBySchedule.get(schedule.id) ?? [],
            }
          );
        } catch (ruleErr) {
          result.errors.push(
            `Aturan pengulangan jadwal ${schedule.id} tidak valid: ${(ruleErr as Error).message}`
          );
          continue;
        }

        const studentCount = schedule.schedule_students?.length || 0;
        for (const dateStr of occurrences) {
          result.totalEvaluated++;
          const key = `${schedule.id}|${dateStr}`;
          // Idempoten: (schedule, tanggal) yang sudah ada dilewati.
          if (existingSet.has(key)) {
            result.skippedCount++;
            continue;
          }
          existingSet.add(key); // cegah duplikat dalam batch yang sama
          toInsert.push({
            schedule_id: schedule.id,
            tutor_id: schedule.tutor_id,
            program_id: schedule.program_id,
            bimbel_type_id: schedule.bimbel_type_id,
            session_date: dateStr,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            status: "scheduled" as const,
            notes: schedule.notes || null,
            created_by: options.userId || null,
          });
          metaByKey.set(key, { schedule, studentCount });
        }
      }

      if (toInsert.length === 0) {
        return result;
      }

      // 5. Batch insert sesi + batch audit (2 roundtrip, bukan 2N).
      const { data: newSessions, error: createErr } = await supabase
        .from("sessions")
        .insert(toInsert)
        .select("id, schedule_id, session_date, tutor_id, program_id");

      if (createErr || !newSessions) {
        result.success = false;
        result.errors.push(`Gagal membuat sesi: ${createErr?.message || "Unknown"}`);
        return result;
      }

      const sessionStudentsToInsert: {
        session_id: string;
        student_id: string;
        enrollment_id: string | null;
        bimbel_type_id: string | null;
      }[] = [];

      for (const s of newSessions as unknown as {
        id: string;
        schedule_id: string;
        session_date: string;
        tutor_id: string;
        program_id: string;
      }[]) {
        const meta = metaByKey.get(`${s.schedule_id}|${s.session_date}`);
        result.createdCount++;
        result.createdSessions.push({
          id: s.id,
          scheduleId: s.schedule_id,
          sessionDate: s.session_date,
          tutorId: s.tutor_id,
          programId: s.program_id,
          studentCount: meta?.studentCount || 0,
        });

        if (meta?.schedule.schedule_students && meta.schedule.schedule_students.length > 0) {
          for (const ss of meta.schedule.schedule_students) {
            sessionStudentsToInsert.push({
              session_id: s.id,
              student_id: ss.student_id,
              enrollment_id: ss.enrollment_id,
              bimbel_type_id: meta.schedule.bimbel_type_id,
            });
          }
        }
      }

      // 6. Batch insert session_students snapshot (Point 3 - Frozen Session Enrollment)
      if (sessionStudentsToInsert.length > 0) {
        try {
          const { error: ssErr } = await supabase
            .from("session_students")
            .insert(sessionStudentsToInsert);

          if (ssErr) {
            console.warn("Gagal membekukan snapshot session_students:", ssErr.message);
            result.errors.push(`Catatan snapshot peserta: ${ssErr.message}`);
          }
        } catch (ssCatchErr: any) {
          console.warn("Exception saat snapshot session_students:", ssCatchErr);
        }
      }

      try {
        await supabase.from("audit_logs").insert(
          result.createdSessions.map((s) => ({
            user_id: options.userId || null,
            action: "SESSION_GENERATED",
            entity_type: "sessions",
            entity_id: s.id,
            metadata: {
              schedule_id: s.scheduleId,
              session_date: s.sessionDate,
              tutor_id: s.tutorId,
              student_count: s.studentCount,
            },
          }))
        );
      } catch (auditErr) {
        console.warn("Gagal merekam audit log session generation:", auditErr);
      }

      return result;
    } catch (err: unknown) {
      result.success = false;
      result.errors.push(
        err instanceof Error ? err.message : "Terjadi kesalahan pada session generator"
      );
      return result;
    }
  }
}
