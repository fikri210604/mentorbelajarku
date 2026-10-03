import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const guard = await requireManagementApi("attendance:read");
  if (!guard.ok) return guard.response;

  const { sessionId } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("attendance")
    .select(
      `id, session_id, student_id, enrollment_id, status, verification_status,
       photo_path, notes, checked_in_at, verified_at,
       students (id, student_code, name),
       learning_records (id, material, notes)`
    )
    .eq("session_id", sessionId);

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil presensi sesi.") },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
