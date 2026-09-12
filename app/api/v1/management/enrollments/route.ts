import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("student_programs")
    .select("*, students (*), programs (*), bimbel_types (*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || (user.role !== "management" && user.role !== "admin")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("student_programs")
      .insert({
        student_id: body.studentId,
        program_id: body.programId,
        bimbel_type_id: body.bimbelTypeId,
        total_sessions: body.totalSessions,
        start_date: body.startDate,
        status: body.status || "active",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
