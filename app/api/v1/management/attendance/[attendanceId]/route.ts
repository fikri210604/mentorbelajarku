import { NextRequest, NextResponse } from "next/server";
import { getAttendanceById } from "@/features/management/attendance/queries/attendance.queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  const { attendanceId } = await params;
  const attendance = await getAttendanceById(attendanceId);
  if (!attendance) {
    return NextResponse.json({ success: false, error: "Attendance not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: attendance });
}
