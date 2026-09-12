import { NextRequest, NextResponse } from "next/server";
import { getAttendances } from "@/features/management/attendance/queries/attendance.queries";
import { AttendanceService } from "@/features/shared/attendance/services/attendance.service";
import { getAuthUser } from "@/lib/auth/session";

export async function GET() {
  const attendances = await getAttendances();
  return NextResponse.json({ success: true, data: attendances });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = await AttendanceService.processAttendanceSubmission(
      body.sessionId,
      body.studentId,
      body.status,
      body.photoBase64,
      body.material,
      body.notes,
      user.user.id
    );
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
