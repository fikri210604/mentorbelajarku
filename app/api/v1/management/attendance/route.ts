import { NextRequest, NextResponse } from "next/server";
import { getAttendances } from "@/features/management/attendance/queries/attendance.queries";
import { AttendanceService } from "@/features/shared/attendance/services/attendance.service";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage, apiError } from "@/lib/traits/response.trait";

export async function GET() {
  const guard = await requireManagementApi("attendance:read");
  if (!guard.ok) return guard.response;

  const attendances = await getAttendances();
  return NextResponse.json({ success: true, data: attendances });
}

export async function POST(req: NextRequest) {
  const guard = await requireManagementApi("attendance:create");
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const data = await AttendanceService.processAttendanceSubmission(
      body.sessionId,
      body.studentId,
      body.status,
      body.photoBase64,
      body.material,
      body.notes,
      guard.user.user.id
    );
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    return apiError(getSafeErrorMessage(err, "Gagal menyimpan presensi."), {
      status: 500,
      code: "INTERNAL",
    });
  }
}
