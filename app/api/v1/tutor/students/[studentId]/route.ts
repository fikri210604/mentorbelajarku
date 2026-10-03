import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireTutorApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const guard = await requireTutorApi("student:read");
  if (!guard.ok) return guard.response;

  const tutorId = guard.user.tutorId as string;
  const { studentId } = await params;
  const supabase = createServerSupabaseClient();

  // Otorisasi level objek: pastikan murid memang berada pada jadwal tutor ini.
  const { data: link, error: linkErr } = await supabase
    .from("schedule_students")
    .select("student_id, schedules!inner (tutor_id)")
    .eq("student_id", studentId)
    .eq("schedules.tutor_id", tutorId)
    .limit(1)
    .maybeSingle();

  if (linkErr) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(linkErr, "Gagal memverifikasi akses murid.") },
      { status: 500 }
    );
  }

  if (!link) {
    return NextResponse.json(
      { success: false, error: "Murid tidak ditemukan pada jadwal Anda." },
      { status: 404 }
    );
  }

  const { data: student, error } = await supabase
    .from("students")
    .select(
      "id, name, student_code, status, school, grade, level, gender, birth_date, parent_name, parent_phone, address"
    )
    .eq("id", studentId)
    .single();

  if (error || !student) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Murid tidak ditemukan.") },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: student });
}
