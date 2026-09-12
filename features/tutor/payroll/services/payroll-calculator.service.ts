import { createServerClient } from "@/lib/supabase/server";

export interface PayableSessionItem {
  sessionId: string;
  studentId: string;
  bimbelTypeId: string;
  rate: number;
  amount: number;
}

export class PayrollCalculatorService {
  static async calculateTutorPayroll(
    tutorId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<{
    grossAmount: number;
    items: PayableSessionItem[];
  }> {
    const supabase = createServerClient();

    // 1. Fetch completed sessions taught by this tutor in period
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, session_date, bimbel_type_id")
      .eq("tutor_id", tutorId)
      .eq("status", "completed")
      .gte("session_date", periodStart)
      .lte("session_date", periodEnd);

    if (sessionsError || !sessions) {
      throw new Error(sessionsError?.message || "Gagal mengambil sesi tutor");
    }

    if (sessions.length === 0) {
      return { grossAmount: 0, items: [] };
    }

    const sessionIds = sessions.map((s) => s.id);

    // 2. Fetch attendances for these sessions
    const { data: attendances } = await supabase
      .from("attendance")
      .select("id, session_id, student_id, status, verification_status")
      .in("session_id", sessionIds);

    // 3. Fetch tutor rates
    const { data: rates } = await supabase
      .from("tutor_rates")
      .select("*")
      .eq("tutor_id", tutorId);

    const items: PayableSessionItem[] = [];
    let grossAmount = 0;

    for (const session of sessions) {
      const matchingRate = rates?.find((r) => {
        if (r.bimbel_type_id !== session.bimbel_type_id) return false;
        const fromOk = r.effective_from <= session.session_date;
        const untilOk = !r.effective_until || r.effective_until >= session.session_date;
        return fromOk && untilOk;
      });

      const ratePerStudent = matchingRate ? Number(matchingRate.rate_per_student) : 25000;

      const sessionAttendances = (attendances || []).filter(
        (att) => att.session_id === session.id && (att.status === "present" || att.status === "late")
      );

      for (const att of sessionAttendances) {
        const itemAmount = ratePerStudent;
        grossAmount += itemAmount;
        items.push({
          sessionId: session.id,
          studentId: att.student_id,
          bimbelTypeId: session.bimbel_type_id,
          rate: ratePerStudent,
          amount: itemAmount,
        });
      }
    }

    return { grossAmount, items };
  }
}
