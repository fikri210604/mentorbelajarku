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
