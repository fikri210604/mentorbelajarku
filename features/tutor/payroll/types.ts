import { Tables } from "@/types/database";

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

/** Riwayat mengajar satu sesi beserta honor yang dihitung server. */
export interface TutorSessionEarning {
  sessionId: string;
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  programName: string;
  bimbelTypeName: string;
  totalStudents: number;
  payableStudents: number;
  /** null = tarif belum dikonfigurasi / gagal dihitung. */
  amount: number | null;
  ratePerStudent: number | null;
  /** true bila sesi sudah masuk ke dokumen payroll (tutor_payments). */
  inPayroll: boolean;
}
