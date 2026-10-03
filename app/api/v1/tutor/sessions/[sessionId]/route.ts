import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireTutorApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const guard = await requireTutorApi("session:read");
  if (!guard.ok) return guard.response;

  const tutorId = guard.user.tutorId as string;
  const { sessionId } = await params;
  const supabase = createServerSupabaseClient();

  // Scope wajib: sesi hanya boleh dibaca jika tutor_id cocok dengan tutor aktif.
  const { data: session, error } = await supabase
    .from("sessions")
    .select(
      `id, session_date, start_time, end_time, status, notes, schedule_id,
       tutor_id, program_id, bimbel_type_id,
       programs (id, code, name),
       bimbel_types (id, name, duration_minutes),
       attendance (
         id, student_id, enrollment_id, status, verification_status, photo_path, notes,
         students (id, name, student_code)
       ),
       schedule_students (
         id, student_id, enrollment_id,
         students (id, name, student_code)
       )`
    )
    .eq("id", sessionId)
    .eq("tutor_id", tutorId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil sesi.") },
      { status: 500 }
    );
  }

  if (!session) {
    return NextResponse.json({ success: false, error: "Sesi tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: session });
}
