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
    .from("schedules")
    .select("student_id, students(id, name, student_code, status, school, grade)")
    .not("student_id", "is", null);

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Deduplicate students
  const studentMap = new Map();
  (data || []).forEach((item: any) => {
    if (item.students && !studentMap.has(item.students.id)) {
      studentMap.set(item.students.id, item.students);
    }
  });

  return NextResponse.json({
    success: true,
    data: Array.from(studentMap.values()),
  });
}
