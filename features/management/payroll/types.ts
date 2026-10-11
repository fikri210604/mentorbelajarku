import { Tables } from "@/types/database";

export type TutorPayment = Tables<"tutor_payments">;
export type TutorPaymentItem = Tables<"tutor_payment_items">;

export interface AttendanceAuditInfo {
  id: string;
  session_id: string;
  student_id: string;
  status: string;
  verification_status: "submitted" | "verified" | "correction_requested";
  photo_path: string | null;
  photo_url?: string | null;
  notes: string | null;
  checked_in_at: string | null;
}

export interface PayrollItemWithDetails extends TutorPaymentItem {
  sessions?: (Tables<"sessions"> & { programs?: Tables<"programs"> | null }) | null;
  students?: Tables<"students"> | null;
  bimbel_types?: Tables<"bimbel_types"> | null;
  attendance?: AttendanceAuditInfo | null;
}

export interface PayrollWithDetails extends TutorPayment {
  tutors?: (Tables<"tutors"> & { profiles?: Tables<"profiles"> | null }) | null;
  items?: PayrollItemWithDetails[];
}
