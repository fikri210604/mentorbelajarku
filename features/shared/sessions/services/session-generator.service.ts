import { createServerSupabaseClient } from "@/lib/supabase/server";

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

/**
 * Service untuk men-generate record sesi pembelajaran aktual (sessions)
 * dari rancangan jadwal rutin (schedules).
 * 
 * Sesuai AGENTS.md Rule 6:
 * - Schedule: Rencana belajar rutin (hari & jam)
 * - Session: Kejadian pembelajaran aktual pada tanggal tertentu
 */
export class SessionGeneratorService {
  /**
   * Helper untuk mendapatkan daftar tanggal 'YYYY-MM-DD' dalam rentang tertentu
   */
  private static getDateRange(startDateStr: string, endDateStr: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDateStr);
    const end = new Date(endDateStr);

    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  /**
   * Eksekusi pembangkitan sesi aktual dari jadwal aktif
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
      // 1. Tentukan tanggal-tanggal yang akan diproses
      let targetDates: string[] = [];
      if (options.startDate && options.endDate) {
        targetDates = this.getDateRange(options.startDate, options.endDate);
      } else if (options.targetDate) {
        targetDates = [options.targetDate];
      } else {
        // Default hari ini (lokal)
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        targetDates = [`${y}-${m}-${d}`];
      }

      if (targetDates.length === 0) {
        return result;
      }

      // 2. Ambil seluruh jadwal aktif beserta relasi muridnya
      let scheduleQuery = supabase
        .from("schedules")
        .select(`
          id,
          tutor_id,
          program_id,
          bimbel_type_id,
          day_of_week,
          start_time,
          end_time,
          location,
          notes,
          status,
          schedule_students (
            id,
            student_id,
            enrollment_id
          )
        `)
        .eq("status", "active");

      if (options.scheduleId) {
        scheduleQuery = scheduleQuery.eq("id", options.scheduleId);
      }
      if (options.tutorId) {
        scheduleQuery = scheduleQuery.eq("tutor_id", options.tutorId);
      }

      const { data: schedules, error: scheduleErr } = await scheduleQuery;

      if (scheduleErr || !schedules) {
        result.success = false;
        result.errors.push(`Gagal mengambil data jadwal: ${scheduleErr?.message || "Data kosong"}`);
        return result;
      }

      if (schedules.length === 0) {
        return result;
      }

      // 3. Untuk setiap tanggal, cocokkan day_of_week dan cek duplikasi
      for (const dateStr of targetDates) {
        const [y, m, d] = dateStr.split("-").map(Number);
        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu

        // Filter jadwal yang harinya cocok
        const matchingSchedules = schedules.filter((s) => s.day_of_week === dayOfWeek);

        if (matchingSchedules.length === 0) continue;

        // Cek sesi yang sudah ada di tanggal ini untuk jadwal terkait
        const scheduleIds = matchingSchedules.map((s) => s.id);
        const { data: existingSessions, error: existErr } = await supabase
          .from("sessions")
          .select("id, schedule_id")
          .eq("session_date", dateStr)
          .in("schedule_id", scheduleIds);

        if (existErr) {
          result.errors.push(`Gagal mengecek sesi eksisting tanggal ${dateStr}: ${existErr.message}`);
          continue;
        }

        const existingScheduleIdSet = new Set((existingSessions || []).map((s) => s.schedule_id));

        for (const schedule of matchingSchedules) {
          result.totalEvaluated++;

          // Jika sesi untuk jadwal & tanggal ini sudah pernah dibuat, lewati (cegah duplikasi)
          if (existingScheduleIdSet.has(schedule.id)) {
            result.skippedCount++;
            continue;
          }

          // Buat sesi baru
          const { data: newSession, error: createErr } = await supabase
            .from("sessions")
            .insert({
              schedule_id: schedule.id,
              tutor_id: schedule.tutor_id,
              program_id: schedule.program_id,
              bimbel_type_id: schedule.bimbel_type_id,
              session_date: dateStr,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              status: "scheduled",
              notes: schedule.notes || null,
              created_by: options.userId || null,
            })
            .select("id, schedule_id, session_date, tutor_id, program_id")
            .single();

          if (createErr || !newSession) {
            result.errors.push(
              `Gagal membuat sesi jadwal ${schedule.id} tanggal ${dateStr}: ${createErr?.message || "Unknown"}`
            );
            continue;
          }

          result.createdCount++;
          result.createdSessions.push({
            id: newSession.id,
            scheduleId: schedule.id,
            sessionDate: dateStr,
            tutorId: schedule.tutor_id,
            programId: schedule.program_id,
            studentCount: schedule.schedule_students?.length || 0,
          });

          // Audit log pencatatan pembuatan sesi aktual
          try {
            await supabase.from("audit_logs").insert({
              user_id: options.userId || null,
              action: "SESSION_GENERATED",
              entity_type: "sessions",
              entity_id: newSession.id,
              metadata: {
                schedule_id: schedule.id,
                session_date: dateStr,
                tutor_id: schedule.tutor_id,
                student_count: schedule.schedule_students?.length || 0,
              },
            });
          } catch (auditErr) {
            console.warn("Gagal merekam audit log session generation:", auditErr);
          }
        }
      }

      return result;
    } catch (err: any) {
      result.success = false;
      result.errors.push(err.message || "Terjadi kesalahan pada session generator");
      return result;
    }
  }
}
