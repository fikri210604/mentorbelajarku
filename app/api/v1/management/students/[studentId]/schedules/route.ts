import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const guard = await requireManagementApi("schedule:read");
  if (!guard.ok) return guard.response;

  const { studentId } = await params;
  const supabase = createServerClient();

  // Murid terhubung ke jadwal melalui tabel pivot `schedule_students`
  // (schedules tidak memiliki kolom student_id).
  const { data, error } = await supabase
    .from("schedule_students")
    .select(
      `id, schedule_id, student_id, enrollment_id,
       schedules (
          id, tutor_id, program_id, bimbel_type_id, day_of_week, days_of_week,
          recurrence_start_date, recurrence_interval, recurrence_count, recurrence_until,
          start_time, end_time, location, status,
         tutors (id, profile_id, profiles (id, full_name)),
         programs (id, code, name),
         bimbel_types (id, name, duration_minutes)
       )`
    )
    .eq("student_id", studentId);

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil jadwal murid.") },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
