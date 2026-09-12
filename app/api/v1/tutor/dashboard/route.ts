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

  let query = supabase.from("schedules").select("id, student_id, day_of_week, start_time, end_time, status, students(id, name, student_code)");
  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data: schedules, error: scheduleError } = await query;
  if (scheduleError) {
    return NextResponse.json({ success: false, error: scheduleError.message }, { status: 500 });
  }

  const uniqueStudentIds = new Set((schedules || []).map((s: any) => s.student_id).filter(Boolean));

  return NextResponse.json({
    success: true,
    data: {
      totalSchedules: (schedules || []).length,
      totalStudents: uniqueStudentIds.size,
      schedules: schedules || [],
    },
  });
}
