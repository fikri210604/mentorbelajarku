import { Tables } from "@/types/database";
import type { AttendanceStatus } from "@/types/database.types";

export type TutorPayment = Tables<"tutor_payments">;
export type TutorPaymentItem = Tables<"tutor_payment_items">;

export interface PayrollWithDetails extends TutorPayment {
  tutors?: (Tables<"tutors"> & { profiles?: Tables<"profiles"> | null }) | null;
  items?: (TutorPaymentItem & {
    sessions?: Tables<"sessions"> | null;
    students?: Tables<"students"> | null;
    bimbel_types?: Tables<"bimbel_types"> | null;
  })[];
}

/**
 * Baris presensi penggajian per murid per pertemuan efektif.
 * Berasal dari view `v_attendance_with_meeting_number` (hanya hadir/late).
 */
export interface PayrollSheetRow {
  attendanceId: string;
  sessionId: string;
  sessionDate: string;
  /** Tanggal siap cetak, contoh: "Senin, 2/10/26". */
  dateStr: string;
  startTime: string | null;
  endTime: string | null;
  studentName: string;
  studentCode: string;
  meetingNumber: number | null;
  meetingCode: string | null;
  status: AttendanceStatus;
  bimbelTypeName: string | null;
}

/** Rekap honor per jenis bimbel untuk satu periode. */
export interface PayrollHonorBreakdown {
  bimbelTypeName: string;
  rate: number;
  count: number;
  subtotal: number;
}

/**
 * Ringkasan honor hasil kalkulasi server (PayrollCalculatorService).
 * `configured = false` bila tarif untuk periode tersebut belum diatur.
 */
export interface PayrollHonorSummary {
  totalSessions: number;
  totalPayableStudents: number;
  grossAmount: number;
  configured: boolean;
  breakdown: PayrollHonorBreakdown[];
}

export interface PayrollTutorOption {
  id: string;
  name: string;
}

