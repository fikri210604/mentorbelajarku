import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireTutorApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  const guard = await requireTutorApi("attendance:read");
  if (!guard.ok) return guard.response;

  const tutorId = guard.user.tutorId as string;
  const { attendanceId } = await params;
  const supabase = createServerSupabaseClient();

  // Otorisasi level objek: attendance hanya boleh dibaca jika sesinya milik tutor aktif.
  const { data, error } = await supabase
    .from("attendance")
    .select(
      `id, session_id, student_id, enrollment_id, status, verification_status,
       photo_path, notes, checked_in_at, verified_at,
       students (id, name, student_code),
       sessions!inner (id, tutor_id, session_date, start_time, end_time)`
    )
    .eq("id", attendanceId)
    .eq("sessions.tutor_id", tutorId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil presensi.") },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ success: false, error: "Presensi tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
