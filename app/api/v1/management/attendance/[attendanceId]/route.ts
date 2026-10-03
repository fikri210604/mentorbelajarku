import { NextRequest, NextResponse } from "next/server";
import { getAttendanceById } from "@/features/management/attendance/queries/attendance.queries";
import { requireManagementApi } from "@/lib/auth/guards";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  const guard = await requireManagementApi("attendance:read");
  if (!guard.ok) return guard.response;

  const { attendanceId } = await params;
  const attendance = await getAttendanceById(attendanceId);
  if (!attendance) {
    return NextResponse.json({ success: false, error: "Data presensi tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: attendance });
}
