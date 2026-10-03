import { createServerClient } from "@/lib/supabase/server";

export interface PayableSessionItem {
  sessionId: string;
  sessionDate: string;
  studentId: string;
  bimbelTypeId: string;
  bimbelTypeName?: string;
  rate: number;
  amount: number;
  isCustomTutorRate: boolean;
}

interface RateRow {
  tutor_id: string | null;
  bimbel_type_id: string;
  level: string;
  rate_per_student: number | string;
  effective_from: string;
  effective_until: string | null;
}

const ANY_LEVEL = "Semua Jenjang";

/**
 * Service kalkulasi payroll tutor.
 * - Fee = rate_per_student × jumlah murid payable.
 * - Hierarki tarif: tarif khusus tutor > tarif global (bimbel_type + level).
 * - Hanya tarif dengan effective dating yang mencakup tanggal sesi.
 * - Payable = status present/late (keputusan bisnis 2026-09-28).
 */
export class PayrollCalculatorService {
  static async calculateTutorPayroll(
    tutorId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<{ grossAmount: number; items: PayableSessionItem[] }> {
    const supabase = createServerClient();

    // 1. Sesi aktual yang selesai dalam periode
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(
        "id, session_date, bimbel_type_id, program_id, bimbel_types (id, name), programs (id, name, level)"
      )
      .eq("tutor_id", tutorId)
      .eq("status", "completed")
      .gte("session_date", periodStart)
      .lte("session_date", periodEnd);

    if (sessionsError || !sessions) {
      throw new Error("Gagal mengambil sesi tutor.");
    }
    if (sessions.length === 0) {
      return { grossAmount: 0, items: [] };
    }

    const sessionIds = sessions.map((s) => s.id);

    // 2. Attendance payable (present/late). Kebijakan: cukup submitted.
    const { data: attendances, error: attError } = await supabase
      .from("attendance")
      .select("id, session_id, student_id, status")
      .in("session_id", sessionIds)
      .in("status", ["present", "late"]);

    if (attError) {
      throw new Error("Gagal mengambil presensi sesi.");
    }

    // 3. Tarif tutor-spesifik maupun global
    const { data: rates, error: ratesError } = await supabase
      .from("tutor_rates")
      .select("tutor_id, bimbel_type_id, level, rate_per_student, effective_from, effective_until")
      .or(`tutor_id.eq.${tutorId},tutor_id.is.null`);

    if (ratesError) {
      throw new Error("Gagal membaca konfigurasi tarif tutor.");
    }

    const findRate = (
      bimbelTypeId: string,
      level: string,
      sessionDate: string,
      requireTutorId: boolean
    ): RateRow | undefined => {
      const candidates = (rates ?? []).filter((r) => {
        const isTutorSpecific = r.tutor_id === tutorId;
        if (requireTutorId && !isTutorSpecific) return false;
        if (!requireTutorId && isTutorSpecific) return false;
        if (r.bimbel_type_id !== bimbelTypeId) return false;
        const levelOk = r.level === level || r.level === ANY_LEVEL;
        if (!levelOk) return false;
        const fromOk = r.effective_from <= sessionDate;
        const untilOk = !r.effective_until || r.effective_until >= sessionDate;
        return fromOk && untilOk;
      });

      // Deterministik: pilih effective_from terbaru; spesifik level menang atas ANY_LEVEL.
      candidates.sort((a, b) => {
        if (a.level !== b.level) return a.level === level ? -1 : 1;
        return a.effective_from < b.effective_from ? 1 : -1;
      });

      return candidates[0];
    };

    const items: PayableSessionItem[] = [];
    let grossAmount = 0;

    for (const session of sessions) {
      const bimbelName = (session.bimbel_types as { name?: string } | null)?.name || "Bimbel";
      const programLevel = (session.programs as { level?: string } | null)?.level || ANY_LEVEL;

      let matchingRate = findRate(session.bimbel_type_id, programLevel, session.session_date, true);
      let isCustomTutorRate = true;

      if (!matchingRate) {
        matchingRate = findRate(session.bimbel_type_id, programLevel, session.session_date, false);
        isCustomTutorRate = false;
      }

      if (!matchingRate) {
        throw new Error(
          `Tarif honor untuk tipe bimbel "${bimbelName}" pada tanggal ${session.session_date} belum diatur. Konfigurasikan tarif terlebih dahulu.`
        );
      }

      const ratePerStudent = Number(matchingRate.rate_per_student);

      const sessionAttendances = (attendances ?? []).filter((att) => att.session_id === session.id);

      for (const att of sessionAttendances) {
        grossAmount += ratePerStudent;
        items.push({
          sessionId: session.id,
          sessionDate: session.session_date,
          studentId: att.student_id,
          bimbelTypeId: session.bimbel_type_id,
          bimbelTypeName: bimbelName,
          rate: ratePerStudent,
          amount: ratePerStudent,
          isCustomTutorRate,
        });
      }
    }

    return { grossAmount, items };
  }
}
