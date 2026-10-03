import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const guard = await requireManagementApi("session:read");
  if (!guard.ok) return guard.response;

  const { scheduleId } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `id, schedule_id, tutor_id, program_id, bimbel_type_id, session_date,
       start_time, end_time, status, notes, created_at, updated_at,
       tutors (id, profile_id, profiles (id, full_name)),
       programs (id, code, name),
       bimbel_types (id, name, duration_minutes)`
    )
    .eq("schedule_id", scheduleId)
    .order("session_date", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil sesi dari jadwal.") },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
