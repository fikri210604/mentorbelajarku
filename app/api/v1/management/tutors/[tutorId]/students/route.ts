import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  const { tutorId } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("schedules")
    .select("student_id, students (*)")
    .eq("tutor_id", tutorId)
    .not("student_id", "is", null);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  const students = data?.map((d) => d.students).filter(Boolean);
  return NextResponse.json({ success: true, data: students });
}
