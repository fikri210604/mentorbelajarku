import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const guard = await requireManagementApi("student:read");
  if (!guard.ok) return guard.response;

  const { studentId } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `id, student_id, program_id, bimbel_type_id, package_id, package_name,
       max_meetings, price, start_date, end_date, status, created_at, updated_at,
       programs (id, code, name, level), bimbel_types (id, name, duration_minutes)`
    )
    .eq("student_id", studentId)
    .order("start_date", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil data paket murid.") },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
