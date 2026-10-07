import { createServerClient } from "@/lib/supabase/server";
import { PayrollCalculatorService } from "@/features/shared/payroll/services/payroll-calculator.service";
import {
  formatIndonesianReportDate,
  monthRange,
  monthsBetween,
  toMonthKey,
} from "@/features/shared/payroll/utils";
import type { Database } from "@/types/database.types";
import type {
  PayrollHonorBreakdown,
  PayrollHonorSummary,
  PayrollSheetRow,
} from "../types";

type AttendanceInvoiceViewRow =
  Database["public"]["Views"]["v_attendance_with_meeting_number"]["Row"];

/**
 * Baris presensi penggajian (invoice) tutor untuk satu bulan.
 * Sumber: view `v_attendance_with_meeting_number` (hanya pertemuan efektif hadir/late).
 */
export async function getTutorMonthlyInvoiceRows(
  tutorId: string,
  month: string
): Promise<PayrollSheetRow[]> {
  const supabase = createServerClient();
  const { start, end } = monthRange(month);

  const { data, error } = await supabase
    .from("v_attendance_with_meeting_number")
    .select(
      "id, session_id, status, session_date, start_time, end_time, student_name, student_code, meeting_number, meeting_code, bimbel_type_name"
    )
    .eq("session_tutor_id", tutorId)
    .gte("session_date", start)
    .lte("session_date", end)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error || !data) {
    console.error("getTutorMonthlyInvoiceRows error:", error?.message);
    return [];
  }

  return (data as unknown as AttendanceInvoiceViewRow[]).map((row) => ({
    attendanceId: row.id,
    sessionId: row.session_id,
    sessionDate: row.session_date,
    dateStr: formatIndonesianReportDate(row.session_date),
    startTime: row.start_time,
    endTime: row.end_time,
    studentName: row.student_name,
    studentCode: row.student_code,
    meetingNumber: row.meeting_number,
    meetingCode: row.meeting_code,
    status: row.status,
    bimbelTypeName: row.bimbel_type_name,
  }));
}

/**
 * Daftar bulan `YYYY-MM` (terbaru lebih dulu) yang bisa dipilih untuk tutor.
 * Dibangun dari presensi paling awal sampai bulan berjalan.
 */
export async function getTutorAttendanceMonths(tutorId: string): Promise<string[]> {
  const currentMonth = toMonthKey(new Date());
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("v_attendance_with_meeting_number")
    .select("session_date")
    .eq("session_tutor_id", tutorId)
    .order("session_date", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return [currentMonth];
  }

  const earliest = (data[0] as { session_date: string }).session_date;
  return monthsBetween(toMonthKey(earliest), currentMonth);
}

/** Daftar bulan yang bisa dipilih dari beberapa tutor sekaligus (untuk admin). */
export async function getPayrollSheetMonths(tutorIds: string[]): Promise<string[]> {
  const currentMonth = toMonthKey(new Date());
  if (tutorIds.length === 0) return [currentMonth];

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("v_attendance_with_meeting_number")
    .select("session_date")
    .in("session_tutor_id", tutorIds)
    .order("session_date", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return [currentMonth];
  }

  const earliest = (data[0] as { session_date: string }).session_date;
  return monthsBetween(toMonthKey(earliest), currentMonth);
}

/**
 * Ringkasan honor tutor untuk satu bulan, dihitung server-side
 * (rate_per_student × jumlah murid payable). `configured=false` bila tarif belum diatur.
 */
export async function getTutorHonorSummary(
  tutorId: string,
  month: string
): Promise<PayrollHonorSummary> {
  const { start, end } = monthRange(month);
  const empty: PayrollHonorSummary = {
    totalSessions: 0,
    totalPayableStudents: 0,
    grossAmount: 0,
    configured: true,
    breakdown: [],
  };

  try {
    const { grossAmount, items } = await PayrollCalculatorService.calculateTutorPayroll(
      tutorId,
      start,
      end
    );

    if (items.length === 0) return empty;

    const breakdownMap = new Map<string, PayrollHonorBreakdown>();
    for (const item of items) {
      const key = item.bimbelTypeName || "Bimbel";
      const current = breakdownMap.get(key);
      if (current) {
        current.count += 1;
        current.subtotal += item.amount;
      } else {
        breakdownMap.set(key, {
          bimbelTypeName: key,
          rate: item.rate,
          count: 1,
          subtotal: item.amount,
        });
      }
    }

    return {
      totalSessions: new Set(items.map((i) => i.sessionId)).size,
      totalPayableStudents: items.length,
      grossAmount,
      configured: true,
      breakdown: Array.from(breakdownMap.values()),
    };
  } catch (err) {
    console.error("getTutorHonorSummary error:", err instanceof Error ? err.message : err);
    return { ...empty, configured: false };
  }
}
