import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const user = await getAuthUser();
  if (user.role !== "tutor" && user.role !== "management") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await params;
  const supabase = createServerSupabaseClient();

  const { data: student, error } = await supabase
    .from("students")
    .select("id, name, student_code, status, school, grade, notes, parent_name, parent_phone")
    .eq("id", studentId)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: student });
}
