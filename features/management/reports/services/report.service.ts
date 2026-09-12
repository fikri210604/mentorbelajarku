import { createServerClient } from "@/lib/supabase/server";

export class ReportService {
  static async getAttendanceSummary(startDate?: string, endDate?: string) {
    const supabase = createServerClient();
    let query = supabase.from("attendance").select("status, count:id");
    const { data } = await query;
    return data || [];
  }

  static async getStudentEnrollmentSummary() {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("students")
      .select("status, count:id");
    return data || [];
  }

  static async getPayrollSummary() {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("tutor_payments")
      .select("status, gross_amount, net_amount");
    return data || [];
  }
}
