import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const guard = await requireManagementApi("session:read");
  if (!guard.ok) return guard.response;

  const { sessionId } = await params;
  const supabase = createServerClient();

  // Peserta sesi berasal dari schedule_students milik jadwal sesi tersebut.
  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .select("id, schedule_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionErr) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(sessionErr, "Gagal mengambil sesi.") },
      { status: 500 }
    );
  }

  if (!session?.schedule_id) {
    return NextResponse.json({ success: true, data: [] });
  }

  const { data, error } = await supabase
    .from("schedule_students")
    .select(
      `student_id, enrollment_id,
       students (id, student_code, name, school, grade, status)`
    )
    .eq("schedule_id", session.schedule_id);

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil peserta sesi.") },
      { status: 500 }
    );
  }

  const students = (data ?? [])
    .map((row) => (row as { students?: unknown }).students)
    .filter(Boolean);

  return NextResponse.json({ success: true, data: students });
}
