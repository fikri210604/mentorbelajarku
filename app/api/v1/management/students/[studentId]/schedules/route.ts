import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("*, tutors (*, profiles (*)), programs (*), bimbel_types (*)")
    .eq("student_id", studentId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, data });
}
