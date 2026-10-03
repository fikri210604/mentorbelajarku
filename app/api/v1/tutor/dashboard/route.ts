import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireTutorApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET() {
  const guard = await requireTutorApi("schedule:read");
  if (!guard.ok) return guard.response;

  const tutorId = guard.user.tutorId as string;
  const supabase = createServerSupabaseClient();

  const { data: schedules, error } = await supabase
    .from("schedules")
    .select(
      `id, day_of_week, start_time, end_time, status,
       schedule_students (student_id, students (id, name, student_code))`
    )
    .eq("tutor_id", tutorId);

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil data dashboard.") },
      { status: 500 }
    );
  }

  const uniqueStudentIds = new Set<string>();
  for (const schedule of schedules ?? []) {
    const rows =
      (schedule as unknown as { schedule_students?: Array<{ student_id?: string }> })
        .schedule_students ?? [];
    for (const row of rows) {
      if (row.student_id) uniqueStudentIds.add(row.student_id);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      totalSchedules: (schedules ?? []).length,
      totalStudents: uniqueStudentIds.size,
      schedules: schedules ?? [],
    },
  });
}
