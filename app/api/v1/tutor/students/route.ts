import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireTutorApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET() {
  const guard = await requireTutorApi("student:read");
  if (!guard.ok) return guard.response;

  const tutorId = guard.user.tutorId as string;
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("schedule_students")
    .select(
      `student_id,
       students (id, name, student_code, status, school, grade),
       schedules!inner (tutor_id, status)`
    )
    .eq("schedules.tutor_id", tutorId);

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil data murid.") },
      { status: 500 }
    );
  }

  const studentMap = new Map<string, unknown>();
  for (const row of data ?? []) {
    const student = (row as { students?: { id?: string } }).students;
    if (student?.id && !studentMap.has(student.id)) {
      studentMap.set(student.id, student);
    }
  }

  return NextResponse.json({ success: true, data: Array.from(studentMap.values()) });
}
