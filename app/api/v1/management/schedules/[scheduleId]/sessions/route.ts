import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*, tutors (*, profiles (*)), programs (*), bimbel_types (*)")
    .eq("schedule_id", scheduleId)
    .order("session_date", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, data });
}
