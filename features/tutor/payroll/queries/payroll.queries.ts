import { createServerClient } from "@/lib/supabase/server";
import { PayrollCalculatorService } from "@/features/shared/payroll/services/payroll-calculator.service";
import { PayrollWithDetails, TutorSessionEarning } from "../types";

export async function getPayrolls(): Promise<PayrollWithDetails[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutor_payments")
    .select(`
      *,
      tutors (*, profiles (*)),
      items:tutor_payment_items (
        *,
        students (*),
        bimbel_types (*)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching payrolls:", error);
    return [];
  }
  return (data as unknown as PayrollWithDetails[]) || [];
}

export async function getPayrollById(id: string): Promise<PayrollWithDetails | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutor_payments")
    .select(`
      *,
      tutors (*, profiles (*)),
      items:tutor_payment_items (
        *,
        students (*),
        bimbel_types (*)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as unknown as PayrollWithDetails;
}

export async function getTutorPayrolls(tutorId: string): Promise<PayrollWithDetails[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutor_payments")
    .select(`
      *,
      items:tutor_payment_items (
        *,
        students (*),
        bimbel_types (*)
      )
    `)
    .eq("tutor_id", tutorId)
    .order("period_start", { ascending: false });

  if (error) return [];
  return (data as unknown as PayrollWithDetails[]) || [];
}

interface EarningSessionRow {
  id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  programs: { name?: string } | null;
  bimbel_types: { name?: string } | null;
  attendance: Array<{ status: string }> | null;
}

/**
 * Riwayat mengajar (sesi completed) tutor + honor per sesi.
 * Honor dihitung di server (rate x payable students), bukan dari client.
 */
export async function getTutorSessionEarnings(tutorId: string): Promise<TutorSessionEarning[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, session_date, start_time, end_time, programs (name), bimbel_types (name), attendance (status)"
    )
    .eq("tutor_id", tutorId)
    .eq("status", "completed")
    .order("session_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error || !data) {
    console.error("getTutorSessionEarnings error:", error?.message);
    return [];
  }

  const sessions = data as unknown as EarningSessionRow[];
  if (sessions.length === 0) return [];

  const dates = sessions.map((s) => s.session_date).sort();
  const amountBySession = new Map<string, number>();
  const rateBySession = new Map<string, number>();
  let calculated = true;

  try {
    const { items } = await PayrollCalculatorService.calculateTutorPayroll(
      tutorId,
      dates[0],
      dates[dates.length - 1]
    );
    for (const item of items) {
      amountBySession.set(item.sessionId, (amountBySession.get(item.sessionId) ?? 0) + item.amount);
      rateBySession.set(item.sessionId, item.rate);
    }
  } catch (err) {
    // Tarif belum diatur: jangan tampilkan angka palsu.
    console.error("Gagal menghitung honor per sesi:", err);
    calculated = false;
  }

  const { data: paidItems } = await supabase
    .from("tutor_payment_items")
    .select("session_id")
    .in(
      "session_id",
      sessions.map((s) => s.id)
    );
  const inPayrollIds = new Set(
    ((paidItems ?? []) as Array<{ session_id: string }>).map((i) => i.session_id)
  );

  return sessions.map((s) => {
    const attendance = s.attendance ?? [];
    const payable = attendance.filter((a) => a.status === "present" || a.status === "late").length;
    return {
      sessionId: s.id,
      sessionDate: s.session_date,
      startTime: s.start_time,
      endTime: s.end_time,
      programName: s.programs?.name || "Program Bimbel",
      bimbelTypeName: s.bimbel_types?.name || "Reguler",
      totalStudents: attendance.length,
      payableStudents: payable,
      amount: calculated ? amountBySession.get(s.id) ?? 0 : null,
      ratePerStudent: rateBySession.get(s.id) ?? null,
      inPayroll: inPayrollIds.has(s.id),
    };
  });
}
