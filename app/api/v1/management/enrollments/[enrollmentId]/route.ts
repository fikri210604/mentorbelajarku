import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  const guard = await requireManagementApi("student:read");
  if (!guard.ok) return guard.response;

  const { enrollmentId } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `id, student_id, program_id, bimbel_type_id, package_id, package_name,
       max_meetings, price, start_date, end_date, status, created_at, updated_at,
       students (id, student_code, name),
       programs (id, code, name),
       bimbel_types (id, name, duration_minutes)`
    )
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil enrollment.") },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ success: false, error: "Enrollment tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
