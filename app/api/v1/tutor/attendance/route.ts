import { NextRequest, NextResponse } from "next/server";
import { requireTutorApi } from "@/lib/auth/guards";
import { getSafeErrorMessage, apiError } from "@/lib/traits/response.trait";
import { AttendanceService } from "@/features/shared/attendance/services/attendance.service";

export async function POST(request: NextRequest) {
  const guard = await requireTutorApi("attendance:create");
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const data = await AttendanceService.processAttendanceSubmission(
      body.sessionId,
      body.studentId,
      body.status,
      body.photoBase64,
      body.material,
      body.notes,
      guard.user.user.id,
      guard.user.tutorId
    );
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    return apiError(getSafeErrorMessage(err, "Gagal menyimpan presensi."), {
      status: 500,
      code: "INTERNAL",
    });
  }
}
