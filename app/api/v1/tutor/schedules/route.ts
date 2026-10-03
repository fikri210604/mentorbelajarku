import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireTutorApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET() {
  const guard = await requireTutorApi("schedule:read");
  if (!guard.ok) return guard.response;

  const tutorId = guard.user.tutorId as string;
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("schedules")
    .select(
      `id, day_of_week, start_time, end_time, status, location, notes,
       program_id, bimbel_type_id,
       programs (id, code, name),
       bimbel_types (id, name, duration_minutes),
       schedule_students (
         id, student_id, enrollment_id,
         students (id, name, student_code)
       )`
    )
    .eq("tutor_id", tutorId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil jadwal.") },
      { status: 500 }
    );
  }

  const schedules = (data ?? []).map((schedule) => {
    const rows =
      (schedule as unknown as { schedule_students?: Array<{ students?: unknown }> })
        .schedule_students ?? [];
    return {
      ...schedule,
      students: rows.map((rs) => rs.students).filter(Boolean),
    };
  });

  return NextResponse.json({ success: true, data: schedules });
}
