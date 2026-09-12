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
    .select("id, day_of_week, start_time, end_time, status, room, student_id, students(id, name, student_code), bimbel_type_id, bimbel_types(id, name, duration_minutes)")
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
