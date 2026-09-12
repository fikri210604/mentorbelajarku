import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getAuthUser();
  if (user.role !== "tutor" && user.role !== "management") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const supabase = createServerSupabaseClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, actual_date, start_time, end_time, status, notes, schedule_id, schedules(id, tutor_id, student_id, bimbel_type_id, students(id, name, student_code))")
    .eq("id", sessionId)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: session });
}
