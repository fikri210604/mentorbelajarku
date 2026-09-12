import { createServerClient } from "@/lib/supabase/server";
import { PayrollWithDetails } from "../types";

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
