import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { AttendanceService } from "@/features/shared/attendance/services/attendance.service";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (user.role !== "tutor" && user.role !== "management") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
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
