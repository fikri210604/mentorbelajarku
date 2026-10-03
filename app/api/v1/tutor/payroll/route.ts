import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireTutorApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET() {
  const guard = await requireTutorApi("payroll:read");
  if (!guard.ok) return guard.response;

  const tutorId = guard.user.tutorId as string;
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("tutor_payments")
    .select("*, tutor_payment_items(*)")
    .eq("tutor_id", tutorId)
    .order("period_end", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil data honor.") },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
