import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (user.role !== "tutor" && user.role !== "management") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const tutorId = user.tutorId;

  let query = supabase
    .from("tutor_payments")
    .select("*, tutor_payment_items(*)")
    .order("period_end", { ascending: false });

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
