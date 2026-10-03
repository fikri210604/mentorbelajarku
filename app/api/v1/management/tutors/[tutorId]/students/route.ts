import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  const guard = await requireManagementApi("student:read");
  if (!guard.ok) return guard.response;

  const { tutorId } = await params;
  const supabase = createServerClient();

  // Relasi tutor → murid melalui schedule_students (schedules tidak punya student_id).
  const { data, error } = await supabase
    .from("schedule_students")
    .select(
      `student_id,
       students (id, student_code, name, school, grade, status),
       schedules!inner (tutor_id, status)`
    )
    .eq("schedules.tutor_id", tutorId);

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil murid binaan tutor.") },
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
