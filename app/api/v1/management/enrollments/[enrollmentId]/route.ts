import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  const { enrollmentId } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("student_programs")
    .select("*, students (*), programs (*), bimbel_types (*)")
    .eq("id", enrollmentId)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Enrollment not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data });
}
